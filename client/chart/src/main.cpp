#include <string>
#include <stdlib.h>
#include <vector>
#include <GL/glew.h>
#include <GLFW/glfw3.h>

#define GLFW_INCLUDE_ES3

#include "lib/Chart.h"
#include "common/loadShaders.h"
#include "common/logger.h"
#include "common/shader_utils.h"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/html5.h>
#endif

using namespace std;

vector<Chart> charts;
GLFWwindow *window;
GLuint programID;
GLuint vertexbuffer;
GLuint VertexArrayID;

Chart *focused;

#ifdef __EMSCRIPTEN__
extern "C" {

void EMSCRIPTEN_KEEPALIVE createInstrument(char* id, char *canvasId, int width, int height) {
    Chart chart = Chart(id, canvasId, width, height);
    charts.push_back(chart);
    focused = &chart;
}

}
#endif

void error_callback(int error, const char *description) {
    consoleLog(description);
    // fprintf(stderr, "Error: %s\n", description);
}

void loop() {
    if (!focused)
        return;

    focused->render();

//    glfwMakeContextCurrent(window);
//
//    // Clear the screen
//    glClear(GL_COLOR_BUFFER_BIT);
//
//    // Use our shader
//    glUseProgram(programID);
//
//    // 1rst attribute buffer : vertices
//    glEnableVertexAttribArray(0);
//    glBindBuffer(GL_ARRAY_BUFFER, vertexbuffer);
//    glVertexAttribPointer(
//            0,                  // attribute 0. No particular reason for 0, but must match the layout in the shader.
//            3,                  // size
//            GL_FLOAT,           // type
//            GL_FALSE,           // normalized?
//            0,                  // stride
//            (void *) 0            // array buffer offset
//    );
//
//    // Draw the triangle !
//    glDrawArrays(GL_TRIANGLES, 0, 3); // 3 indices starting at 0 -> 1 triangle
//
//    glDisableVertexAttribArray(0);
//
//    // Swap buffers
//    glfwSwapBuffers(window);
    glfwPollEvents();
}

int *get_resolution() {
    const GLFWvidmode *mode = glfwGetVideoMode(glfwGetPrimaryMonitor());

    static int arr[2];
    arr[0] = mode->width;
    arr[1] = mode->height;

    return arr;
}

void key_callback(GLFWwindow *window, int key, int scancode, int action, int mods) {
    if (focused == 0)
        return;

    if (action == GLFW_PRESS)
        focused->onKeyDown(key);

    if (action == GLFW_RELEASE)
        focused->onKeyUp(key);
}

int main(int argc, char **argv) {
    // int *resolution = get_resolution();
    int width = 100;
    int height = 100;

    consoleLog("WebAssembly init \n");
    glfwSetErrorCallback(error_callback);

    // Initialise GLFW
    if (!glfwInit()) {
        fprintf(stderr, "Failed to initialize GLFW\n");
        getchar();
        return -1;
    }

    glfwWindowHint(GLFW_SAMPLES, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE); // To make MacOS happy; should not be needed
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    // Open a window and create its OpenGL context
    window = glfwCreateWindow(width, height, "Tutorial 02 - Red triangle", NULL, NULL);
    if (window == NULL) {
        fprintf(stderr,
                "Failed to open GLFW window. If you have an Intel GPU, they are not 3.3 compatible. Try the 2.1 version of the tutorials.\n");
        getchar();
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);


    glewExperimental = true; // Needed for core profile
    if (glewInit() != GLEW_OK) {
        fprintf(stderr, "Failed to initialize GLEW\n");
        getchar();
        glfwTerminate();
        return -1;
    }

    glfwSetKeyCallback(window, key_callback);
    // Ensure we can capture the escape key being pressed below
    // glfwSetInputMode(window, GLFW_STICKY_KEYS, GL_TRUE);

    // Dark blue background
    glClearColor(0.0f, 0.0f, 0.4f, 1);

    glGenVertexArrays(1, &VertexArrayID);
    glBindVertexArray(VertexArrayID);

    // Create and compile our GLSL program from the shaders
    programID = create_program("shaders/TriangleVertex.glsl", "shaders/TriangleFragment.glsl");

    static const GLfloat g_vertex_buffer_data[] = {
            -1.0f, -1.0f, 0.0f,
            1.0f, -1.0f, 0.0f,
            0.0f, 1.0f, 0.0f,
    };

    glGenBuffers(1, &vertexbuffer);
    glBindBuffer(GL_ARRAY_BUFFER, vertexbuffer);
    glBufferData(GL_ARRAY_BUFFER, sizeof(g_vertex_buffer_data), g_vertex_buffer_data, GL_STATIC_DRAW);

#ifdef __EMSCRIPTEN__
    emscripten_set_main_loop(loop, 0, 1);
#else
    while (!glfwWindowShouldClose(window)) {
        loop();
    }
#endif
}