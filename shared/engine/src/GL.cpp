//
// Created by Kewin Brandsma on 20/07/2017.
//

#include "Camera.h"
#include "GL/glew.h"
#include "GL.h"

#include "Background.h"
#include "Cubes.h"
#include "Chart.h"
#include <vector>
#include "../extern/stb_image.h"
#include "logger.h"
#include "Instrument.h"
#include "SkyBox.h"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/html5.h>
#endif

#include "Text.h"
#include "Level.h"

using namespace std;

void keyCallback(GLFWwindow *window, int key, int scancode, int action, int mods);

void mouseCallback(GLFWwindow *window, double xpos, double ypos);

void windowSizeCallback(GLFWwindow *window, int width, int height);

void windowCloseCallback(GLFWwindow *window);

void errorCallback(int error, const char *description);

int window_width = 1600;
int window_height = 1200;
float lastX = window_width / 2.0f;
float lastY = window_height / 2.0f;
bool firstMouse = true;

Background *background;
Camera *camera;
Cubes *cubes;
Text *text;
vector<Chart *> charts;
SkyBox *skyBox;
Level *level;

GL *gl;

/**
 * Loop handler that gets called each animation frame,
 * process the input, update the position of the owl and
 * then render the texture
 */
void loop_handler(void *arg) {
    struct context *ctx = (context *) arg;

    gl->render();
}


void t() {};

GL::GL() {
    initOpenGLWindow();

    camera = new Camera(glm::vec3(0.0f, 10.0f, 3.0f));
    skyBox = new SkyBox(ctx->window, camera);
//    background = new Background(ctx->window, camera);
    text = new Text(ctx->window);
    cubes = new Cubes(ctx->window, camera);
    level = new Level(ctx->window, camera);

    level->build();

#ifdef __EMSCRIPTEN__
    emscripten_set_main_loop_arg(loop_handler, &ctx, 0, 0);
#else
    /* Draw the Image on rendering surface */
    while (!glfwWindowShouldClose(ctx->window))
    {

        camera->processInput(ctx->window);

        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        level->render();

        skyBox->render();
        cubes->render();
//        background->render();
        glfwSwapBuffers(ctx->window);
        glfwPollEvents();
    }
#endif
}

int GL::initOpenGLWindow() {
    glfwSetErrorCallback(errorCallback);

    // Initialise GLFW
    if (!glfwInit()) {
        fprintf(stderr, "Failed to initialize GLFW\n");
        getchar();
        return -1;
    }

    glfwWindowHint(GLFW_SAMPLES, 1);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE); // To make MacOS happy; should not be needed
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    // Open a window and create its OpenGL context
    ctx->window = glfwCreateWindow(window_width, window_height, "Tutorial 02 - Red triangle", NULL, NULL);
    if (ctx->window == NULL) {
        fprintf(stderr, "Failed to open GLFW window. \n");
        getchar();
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(ctx->window);

    glewExperimental = true; // Needed for core profile on OS X
    if (glewInit() != GLEW_OK) {
        fprintf(stderr, "Failed to initialize GLEW\n");
        getchar();
        glfwTerminate();
        return -1;
    }

    glEnable(GL_DEPTH_TEST);

    glfwSetInputMode(ctx->window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);
    glfwSetCursorPosCallback(ctx->window, mouseCallback);
    glfwSetKeyCallback(ctx->window, keyCallback);
    glfwSetWindowSizeCallback(ctx->window, windowSizeCallback);
    glfwSetWindowCloseCallback(ctx->window, windowCloseCallback);

    glClearColor(0.0f, 0.0f, 0.0f, 1);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    // Flip all textures on Y axis
    stbi_set_flip_vertically_on_load(true);

    return 0;
}

void GL::render() {

    for (auto &chart : charts) {
        if (chart->id == this->focusedId && chart->checkKeys(ctx) == 1) {

            this->setWindowSize(chart->width, chart->height);

            glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

            chart->render(chart->width, chart->height);

            glfwSwapBuffers(ctx->window);

#ifdef __EMSCRIPTEN__
            EM_ASM_({
                        window.Module.custom.updateClientCanvas($0);
                    }, chart->id);
#endif
        }
    }
}

void GL::renderSingle(int id, int width, int height) {

    for (auto &chart : charts) {
        if (chart->id == id) {

            this->setWindowSize(chart->width, chart->height);

            glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

            chart->render(chart->width, chart->height);

            glfwSwapBuffers(ctx->window);

#ifdef __EMSCRIPTEN__
            EM_ASM_({
                 window.Module.custom.updateClientCanvas($0);
            }, chart->id);
#endif
        }
    }
}

void keyCallback(GLFWwindow *window, int key, int scancode, int action, int mods) {
    if (key == GLFW_KEY_ESCAPE) {
#ifndef __EMSCRIPTEN__
//        destroy();
#endif
    }
}

int GL::createChart(int id, Instrument *instrument, int type) {

    Chart *chart = new Chart(id, instrument, ctx->window, camera);
    charts.push_back(chart);

    return 0;
}

void GL::getWindowSize(int width, int height) {
    glfwGetWindowSize(ctx->window, &width, &height);
}

void GL::setWindowSize(int width, int height) {
#ifdef __EMSCRIPTEN__
    emscripten_set_canvas_size(width, height);
#endif
    glfwSetWindowSize(ctx->window, width, height);
}

void mouseCallback(GLFWwindow *window, double xpos, double ypos) {
    if (firstMouse) {
        lastX = xpos;
        lastY = ypos;
        firstMouse = false;
    }

    float xoffset = xpos - lastX;
    float yoffset = lastY - ypos;
    lastX = xpos;
    lastY = ypos;

    camera->ProcessMouseMovement(xoffset, yoffset);
}

void windowSizeCallback(GLFWwindow *window, int width, int height) {

}

void errorCallback(int error, const char *description) {
    consoleLog(error);
    consoleLog(description);
}

void windowCloseCallback(GLFWwindow *window) {
    glfwSetWindowShouldClose(window, GLFW_TRUE);
}

int GL::destroy() {
    if (background != NULL) {
        background->destroy();
        background = NULL;
    }

    if (cubes != NULL) {
        cubes->destroy();
        cubes = NULL;
    }

    for (auto &chart : charts) {
        chart->destroy();
    }

    charts.clear();

    return 0;
}