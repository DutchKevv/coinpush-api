#include <string>
#include <stdlib.h>
#include <vector>
#include <math.h>
#include <assert.h>
#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <emscripten.h>
#include "../../extern/glm/glm.hpp"
#include "../../extern/glm/gtc/matrix_transform.hpp"
#include "../../extern/glm/gtc/type_ptr.hpp"

#define GLFW_INCLUDE_ES3

#include "Chart.h"
#include "../common/loadShaders.h"
#include "../common/shader_utils.h"
#include "../common/logger.h"

#include "res_texture.c"

GLint attribute_coord2d;
GLint uniform_color;
GLint uniform_transform;

float offset_x = 0.0;
float offset_x_step = 0;
float scale_x = 1.0;
float scale_x_step = 0;

const int border = 10;
const int tickSize = 10;

bool interpolate = false;
bool clamp = false;
bool showpoints = true;
int mode = 3;

struct point {
    GLfloat x;
    GLfloat y;
};

GLuint vbo[3];

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

// Create a projection matrix that has the same effect as glViewport().
// Optionally return scaling factors to easily convert normalized device coordinates to pixels.
//
glm::mat4 viewport_transform(float x, float y, float window_width, float width, float window_height, float height, float *pixel_x = 0, float *pixel_y = 0) {
    // Map OpenGL coordinates (-1,-1) to window coordinates (x,y),
    // (1,1) to (x + width, y + height).

    // First, we need to know the real window size:

    // Calculate how to translate the x and y coordinates:
    float offset_x = (2.0 * x + (width - window_width)) / window_width;
    float offset_y = (2.0 * y + (height - window_height)) / window_height;

    // Calculate how to rescale the x and y coordinates:
    float scale_x = width / window_width;
    float scale_y = height / window_height;

    // Calculate size of pixels in OpenGL coordinates
    if (pixel_x)
        *pixel_x = 2.0 / width;
    if (pixel_y)
        *pixel_y = 2.0 / height;

    return glm::scale(glm::translate(glm::mat4(1), glm::vec3(offset_x, offset_y, 0)), glm::vec3(scale_x, scale_y, 1));
}

EM_BOOL uievent_callback(int eventType, const EmscriptenUiEvent *e, void *userData) {
    printf("detail: %ld, document.body.client size: (%d,%d), window.inner size: (%d,%d), scrollPos: (%d, %d)\n",
          e->detail, e->documentBodyClientWidth, e->documentBodyClientHeight,
           e->windowInnerWidth, e->windowInnerHeight, e->scrollTop, e->scrollLeft);

    return 0;
}


Chart::Chart(char *id, char *canvasId, int width, int height) : id(id), canvasId(canvasId), width(width), height(height) {
    this->init();
    this->render();

    // emscripten_set_resize_callback(0, 0, 1, uievent_callback);
}

int Chart::init() {
    this->createContext();
    this->initResources();

    return 0;
}

int Chart::initResources() {
    this->programId = LoadShader("shaders/graph.v.glsl", "shaders/graph.f.glsl");

    if (this->programId == 0) {
        consoleLog("PRORGRAM IS INVALID");
        return 0;
    }
    attribute_coord2d = get_attrib(this->programId, "coord2d");
    uniform_transform = get_uniform(this->programId, "transform");
    uniform_color = get_uniform(this->programId, "color");

    if (attribute_coord2d == -1 || uniform_transform == -1 || uniform_color == -1)
        return 0;

    // Create the vertex buffer object
    glGenBuffers(3, vbo);
    glBindBuffer(GL_ARRAY_BUFFER, vbo[0]);

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

    // Create a VBO for the border
    static const point border[4] = { {-1, -1}, {1, -1}, {1, 1}, {-1, 1} };
    glBindBuffer(GL_ARRAY_BUFFER, vbo[1]);
    glBufferData(GL_ARRAY_BUFFER, sizeof border, border, GL_STATIC_DRAW);

    return 1;
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

    glClearColor(
            this->backgroundColor[0],
            this->backgroundColor[1],
            this->backgroundColor[2],
            this->backgroundColor[3]
    );
}

void Chart::setCurrentContext() {
    int res = emscripten_webgl_make_context_current(this->context);
    assert(res == EMSCRIPTEN_RESULT_SUCCESS);
    assert(emscripten_webgl_get_current_context() == this->context);
}

void Chart::render(void) {
    // this->setCurrentContext();

    // glViewport(0, 0, this->width, this->height); //in pixels
    this->updateZoomAndPan();

    glUseProgram(this->programId);

    glClearColor(0, 0, 0, 1);
    glClear(GL_COLOR_BUFFER_BIT);

    /* ---------------------------------------------------------------- */
    /* Draw the graph */

    // Set our viewport, this will clip geometry
    glViewport(border + tickSize, border + tickSize, this->width - border * 2 - tickSize, this->height - border * 2 - tickSize);

    // Set the scissor rectangle,this will clip fragments
    glScissor(border + tickSize, border + tickSize, this->width - border * 2 - tickSize, this->height - border * 2 - tickSize);

    glEnable(GL_SCISSOR_TEST);

    // Set our coordinate transformation matrix
    glm::mat4 transform = glm::translate(glm::scale(glm::mat4(1.0f), glm::vec3(scale_x, 1, 1)), glm::vec3(offset_x, 0, 0));
    glUniformMatrix4fv(uniform_transform, 1, GL_FALSE, glm::value_ptr(transform));

    // Set the color to red
    GLfloat red[4] = { 1, 0, 0, 1 };
    glUniform4fv(uniform_color, 1, red);

    // Draw using the vertices in our vertex buffer object
    glBindBuffer(GL_ARRAY_BUFFER, vbo[0]);

    glEnableVertexAttribArray(attribute_coord2d);
    glVertexAttribPointer(attribute_coord2d, 2, GL_FLOAT, GL_FALSE, 0, 0);
    glDrawArrays(GL_LINE_STRIP, 0, 2000);

    // Stop clipping
    glViewport(0, 0, this->width, this->height);
    glDisable(GL_SCISSOR_TEST);

    /* ---------------------------------------------------------------- */
    /* Draw the borders */

    float pixel_x, pixel_y;

    // Calculate a transformation matrix that gives us the same normalized device coordinates as above
    transform = viewport_transform(border + tickSize, border + tickSize, this->width, this->width - border * 2 - tickSize, this->height, this->height - border * 2 - tickSize, &pixel_x, &pixel_y);

    // Tell our vertex shader about it
    glUniformMatrix4fv(uniform_transform, 1, GL_FALSE, glm::value_ptr(transform));

    // Border color
    glUniform4fv(uniform_color, 1, this->borderColor);

    // Draw a border around our graph
    glBindBuffer(GL_ARRAY_BUFFER, vbo[1]);
    glVertexAttribPointer(attribute_coord2d, 2, GL_FLOAT, GL_FALSE, 0, 0);
    glDrawArrays(GL_LINE_LOOP, 0, 4);

    /* ---------------------------------------------------------------- */
    /* Draw the y tick marks */

    point ticks[42];

    for (int i = 0; i <= 20; i++) {
        float y = -1 + i * 0.1;
        float tickscale = (i % 10) ? 0.5 : 1;

        ticks[i * 2].x = -1;
        ticks[i * 2].y = y;
        ticks[i * 2 + 1].x = -1 - tickSize * tickscale * pixel_x;
        ticks[i * 2 + 1].y = y;
    }

    glBindBuffer(GL_ARRAY_BUFFER, vbo[2]);
    glBufferData(GL_ARRAY_BUFFER, sizeof ticks, ticks, GL_DYNAMIC_DRAW);
    glVertexAttribPointer(attribute_coord2d, 2, GL_FLOAT, GL_FALSE, 0, 0);
    glDrawArrays(GL_LINES, 0, 42);

    /* ---------------------------------------------------------------- */
    /* Draw the x tick marks */

    float tickspacing = 0.1 * powf(10, -floor(log10(scale_x)));	// desired space between ticks, in graph coordinates
    float left = -1.0 / scale_x - offset_x;	// left edge, in graph coordinates
    float right = 1.0 / scale_x - offset_x;	// right edge, in graph coordinates
    int left_i = ceil(left / tickspacing);	// index of left tick, counted from the origin
    int right_i = floor(right / tickspacing);	// index of right tick, counted from the origin
    float rem = left_i * tickspacing - left;	// space between left edge of graph and the first tick

    float firsttick = -1.0 + rem * scale_x;	// first tick in device coordinates

    int nticks = right_i - left_i + 1;	// number of ticks to show

    if (nticks > 21)
        nticks = 21;	// should not happen

    for (int i = 0; i < nticks; i++) {
        float x = firsttick + i * tickspacing * scale_x;
        float tickscale = ((i + left_i) % 10) ? 0.5 : 1;

        ticks[i * 2].x = x;
        ticks[i * 2].y = -1;
        ticks[i * 2 + 1].x = x;
        ticks[i * 2 + 1].y = -1 - tickSize * tickscale * pixel_y;
    }

    glBufferData(GL_ARRAY_BUFFER, sizeof ticks, ticks, GL_DYNAMIC_DRAW);
    glVertexAttribPointer(attribute_coord2d, 2, GL_FLOAT, GL_FALSE, 0, 0);
    glDrawArrays(GL_LINES, 0, nticks * 2);


    // And we are done.

    glDisableVertexAttribArray(attribute_coord2d);

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
    // glLineWidth(10.0);
    // glEnableClientState(GL_VERTEX_ARRAY);
    // glVertexPointer(3, GL_FLOAT, 0, lineVertices);
    // glDrawArrays(GL_LINES, 0, 2);
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