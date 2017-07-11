#include <string>
#include <stdlib.h>
#include <vector>
#include <math.h>
#include <assert.h>
#include <GL/glew.h>
#include <GLFW/glfw3.h>

#define GLFW_INCLUDE_ES3

#include "Chart.h"
#include "../common/loadShaders.h"
#include "../common/shader_utils.h"
#include "../common/logger.h"

#include "res_texture.c"

GLuint program;
GLint attribute_coord2d;
GLint uniform_offset_x;
GLint uniform_scale_x;
GLint uniform_sprite;
GLuint texture_id;
GLint uniform_mytexture;
GLint uniform_point_size;

float offset_x = 0.0;
float offset_x_step = 0;

float scale_x = 1.0;
float scale_x_step = 0;

int mode = 3;

struct point {
    GLfloat x;
    GLfloat y;
};

GLuint vbo;

using namespace std;

static const GLfloat lineVertices[] = {
        200, 100, 0,
        100, 300, 0
};

static const GLfloat g_vertex_buffer_data[] = {
        -1.0f, -1.0f, 0.0f,
        1.0f, -1.0f, 0.0f,
        1.0f, 1.0f, 0.0f,

        -1.0f, -1.0f, 0.0f,
        -1.0f, 1.0f, 0.0f,
        1.0f, 1.0f, 0.0f
};

int init_resources() {
    program = LoadShader("shaders/graph.v.glsl", "shaders/graph.f.glsl");

    if (program == 0) {
        consoleLog("PRORGRAM IS INVALID");
        return 0;
    }

    attribute_coord2d = get_attrib(program, "coord2d");
    uniform_offset_x = get_uniform(program, "offset_x");
    uniform_scale_x = get_uniform(program, "scale_x");
    uniform_sprite = get_uniform(program, "sprite");
    uniform_mytexture = get_uniform(program, "mytexture");
    uniform_point_size = get_uniform(program, "point_size");

//    if (attribute_coord2d == -1 || uniform_offset_x == -1 || uniform_scale_x == -1 || uniform_sprite == -1 || uniform_mytexture == -1) {
//        consoleLog("ONE OF THE ATTRIBUTES RETURNED -1!");
//        // return 0;
//    }

    /* Upload the texture for our point sprites */
    glActiveTexture(GL_TEXTURE0);
    glGenTextures(1, &texture_id);
    glBindTexture(GL_TEXTURE_2D, texture_id);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, res_texture.width, res_texture.height, 0, GL_RGBA, GL_UNSIGNED_BYTE, res_texture.pixel_data);

    // Create the vertex buffer object
    glGenBuffers(1, &vbo);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);

    // Create our own temporary buffer
    point graph[2000];

    // Fill it in just like an array
    for (int i = 0; i < 2000; i++) {
        float x = (i - 1000.0) / 100.0;

        graph[i].x = x;
        graph[i].y = sin(x * 10.0) / (1.0 + x * x);
    }

    // Tell OpenGL to copy our array to the buffer object
    glBufferData(GL_ARRAY_BUFFER, sizeof graph, graph, GL_STATIC_DRAW);

    return 1;
}


Chart::Chart(char *id, char *canvasId, int width, int height) : id(id), canvasId(canvasId), width(width), height(height) {
    this->init();
    this->render();
}

int Chart::init() {
    this->createContext();
    init_resources();

    // glViewport(0, 0, this->width, this->height); //in pixels
    return 0;
}

void Chart::createContext() {
    string logText = "CanvasID : ";
    logText += this->canvasId;

    consoleLog(logText);

    EmscriptenWebGLContextAttributes ctxAttrs;
    emscripten_webgl_init_context_attributes(&ctxAttrs);
    ctxAttrs.alpha = GL_TRUE;
    ctxAttrs.depth = GL_TRUE;
    ctxAttrs.stencil = GL_TRUE;
    ctxAttrs.antialias = 4;
    // ctxAttrs.premultipliedAlpha = false;
    // ctxAttrs.preserveDrawingBuffer = false;
    ctxAttrs.minorVersion = 0;
    ctxAttrs.majorVersion = 2;

    // emscripten_webgl_init_context_attributes(&attrs);
    this->context = emscripten_webgl_create_context(0, &ctxAttrs);
    assert(this->context > 0); // Must have received a valid context.

    this->setCurrentContext();

    glewExperimental = true; // Needed for core profile
    if (glewInit() != GLEW_OK) {
        fprintf(stderr, "Failed to initialize GLEW\n");
        getchar();
        return;
    }

    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    glEnable(GL_POINT_SPRITE);
    glEnable(GL_VERTEX_PROGRAM_POINT_SIZE);

    // Dark blue background
    glClearColor(
            this->backgroundColor[0],
            this->backgroundColor[1],
            this->backgroundColor[2],
            this->backgroundColor[3]
    );

//    glGenVertexArrays(1, &this->triangleVertexArrayId);
//    glBindVertexArray(triangleVertexArrayId);

    // Create and compile our GLSL program from the shaders
    // this->programID = LoadShader("shaders/graph.v.glsl", "shaders/graph.f.glsl");
//    static const GLfloat lineVertices[] = {
//            200, 100, 0,
//            100, 300, 0
//    };
//
//    static const GLfloat g_vertex_buffer_data[] = {
//            -1.0f, -1.0f, 0.0f,
//            1.0f, -1.0f, 0.0f,
//            1.0f, 1.0f, 0.0f,
//            -1.0f, -1.0f, 0.0f,
//            -1.0f, 1.0f, 0.0f,
//            1.0f, 1.0f, 0.0f,
//
////            -1.0f, -1.0f, 0.0f,
////            1.0f, -1.0f, 0.0f,
////            0.0f, 1.0f, 0.0f,
////            -1.0f, -1.0f, 0.0f,
////            1.0f, 1.0f, 0.0f,
////            1.0f, 1.0f, 0.0f,
//    };

//    glGenBuffers(1, &triangleVertexBuffer);
//    glBindBuffer(GL_ARRAY_BUFFER, triangleVertexBuffer);
//    glBufferData(GL_ARRAY_BUFFER, sizeof(g_vertex_buffer_data), g_vertex_buffer_data, GL_STATIC_DRAW);
}

void Chart::setCurrentContext() {
    int res = emscripten_webgl_make_context_current(this->context);
    assert(res == EMSCRIPTEN_RESULT_SUCCESS);
    assert(emscripten_webgl_get_current_context() == this->context);
}

void Chart::render(void) {
    this->setCurrentContext();
    this->updateZoomAndPan();

    glUseProgram(program);
    glUniform1i(uniform_mytexture, 0);

    glUniform1f(uniform_offset_x, offset_x);
    glUniform1f(uniform_scale_x, scale_x);

    glClearColor(0.0, 0.0, 0.0, 0.0);
    glClear(GL_COLOR_BUFFER_BIT);

    /* Draw using the vertices in our vertex buffer object */
    glBindBuffer(GL_ARRAY_BUFFER, vbo);

    glEnableVertexAttribArray(attribute_coord2d);
    glVertexAttribPointer(
            attribute_coord2d, // attribute 0. No particular reason for 0, but must match the layout in the shader.
            2, // size
            GL_FLOAT, // type
            GL_FALSE, // normalized?
            0, // stride
            0   // array buffer offset
    );

    /* Push each element in buffer_vertices to the vertex shader */
    switch (mode) {
        case 0:
            glUniform1f(uniform_sprite, 0);
            glDrawArrays(GL_LINES, 0, 2000);
            break;
        case 1:
            glUniform1f(uniform_sprite, 0);
            glDrawArrays(GL_LINE_STRIP, 0, 2000);
            break;
        case 2:
            glUniform1f(uniform_sprite, 1);
            glDrawArrays(GL_POINTS, 0, 2000);
            break;
        case 3:
            glUniform1f(uniform_point_size, res_texture.width);
            glDrawArrays(GL_POINTS, 0, 2000);
            break;
    }

    glFlush();
}

void Chart::updateZoomAndPan() {
    offset_x += offset_x_step;

    if (scale_x_step == 0)
        return;

    if (scale_x_step > 0) {
        scale_x *= scale_x_step;
    } else {
        scale_x /= scale_x_step;
    }
}

void Chart::drawGrid(void) {
    glLineWidth(10.0);
    // glEnableClientState(GL_VERTEX_ARRAY);
    // glVertexPointer(3, GL_FLOAT, 0, lineVertices);
    glDrawArrays(GL_LINES, 0, 2);
    // glColor4f(gridColor[0], gridColor[1], gridColor[2], gridColor[3]);
//
//    // Horizontal lines
//    int offset = 0;
//    while ((offset += squareSize) < height) {
//        glBegin(GL_LINES);
//        glVertex2f(width, offset);
//        glVertex2f(0, offset);
//        glEnd();
//    }
//
//    // Vertical lines
//    offset = 0;
//    while ((offset += squareSize) < width) {
//        glBegin(GL_LINES);
//        glVertex2f(offset, height);
//        glVertex2f(offset, 0);
//        glEnd();
//    }
}

void Chart::onKeyDown(int key) {

    switch(key) {
        case GLFW_KEY_LEFT:
            // offset_x -= 0.1;
            offset_x_step = -0.1;
            break;
        case GLFW_KEY_RIGHT:
            // offset_x += 0.1;
            offset_x_step = 0.1;
            break;
        case GLFW_KEY_UP:
            // scale_x *= 1.5;
            scale_x_step = 1.5;
            break;
        case GLFW_KEY_DOWN:
            // scale_x /= 1.5;
            scale_x_step = -1.5;
            break;
        case GLFW_KEY_HOME:
            offset_x = 0.0;
            scale_x = 1.0;
            break;
    }

    this->render();
}

void Chart::onKeyUp(int key) {
    offset_x_step = 0;
    scale_x_step = 0;
}
//
//void Chart::startKeyPressUpdateLoop(char *type, int num) {
//    if (strncmp(type, "offset", 2)) {
//        offset_x += num;
//    }
//    else if (type == "scale") {
//        scale_x *= num;
//    }
//}