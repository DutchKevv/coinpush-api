//
// Created by Kewin Brandsma on 20/07/2017.
//

#include <GL/glew.h>
//#define GLFW_INCLUDE_NONE

#include <GLFW/glfw3.h>
#include "Camera.h"
#include "GL.h"
#include "Background.h"
#include "Cubes.h"
#include "Chart.h"
#include <vector>
#include "../extern/stb_image.h"
#include "logger.h"
#include "Instrument.h"
#include <emscripten.h>
#include <emscripten/html5.h>

using namespace std;

void keyCallback(GLFWwindow *window, int key, int scancode, int action, int mods);

void mouseCallback(GLFWwindow *window, double xpos, double ypos);

void windowSizeCallback(GLFWwindow *window, int width, int height);

void windowCloseCallback(GLFWwindow *window);

void errorCallback(int error, const char *description);

int window_width = 1024;
int window_height = 800;
float yaw = 0, pitch = 0;
float lastX = window_width / 2.0f;
float lastY = window_height / 2.0f;
bool firstMouse = true;

Background *background;
Camera *camera;
Cubes *cubes;
vector<Chart *> charts;

GL::GL() {
    initOpenGLWindow();

    camera = new Camera(glm::vec3(0.0f, 0.0f, 3.0f));
    background = new Background(window, camera);
    cubes = new Cubes(window, camera);

    render();
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
    window = glfwCreateWindow(window_width, window_height, "Tutorial 02 - Red triangle", NULL, NULL);
    if (window == NULL) {
        fprintf(stderr, "Failed to open GLFW window. \n");
        getchar();
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);

    glewExperimental = true; // Needed for core profile on OS X
    if (glewInit() != GLEW_OK) {
        fprintf(stderr, "Failed to initialize GLEW\n");
        getchar();
        glfwTerminate();
        return -1;
    }

    glEnable(GL_DEPTH_TEST);

    glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);
    glfwSetCursorPosCallback(window, mouseCallback);
    glfwSetKeyCallback(window, keyCallback);
    glfwSetWindowSizeCallback(window, windowSizeCallback);
    glfwSetWindowCloseCallback(window, windowCloseCallback);

    glClearColor(0.0f, 0.0f, 0.0f, 1);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    // Flip all textures on Y axis
    stbi_set_flip_vertically_on_load(true);

    return 0;
}

void GL::renderTest() {
    glClearColor(0.0f, 0.0f, 0.0f, 1);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glfwGetWindowSize(window, &this->windowWidth, &this->windowHeight);

    camera->processInput(window);

    cubes->render();
    background->render();

    glfwSwapBuffers(window);
    glfwPollEvents();
}

void GL::render() {

    for (auto &chart : charts) {
        if (chart->id == focusedId && chart->checkKeys() == 1) {
            glfwSetWindowSize(window, chart->width, chart->height);
            glClearColor(0.0f, 0.0f, 0.0f, 1);
            glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

            chart->render(chart->width, chart->height);

            glfwSwapBuffers(window);

#ifdef __EMSCRIPTEN__
            EM_ASM_({
                 window.Module.custom.updateClientCanvas($0);
            }, chart->id);
#endif
            glfwPollEvents();
        }
    }
}

void GL::renderSingle(int id, int width, int height) {

    for (auto &chart : charts) {
        if (chart->id == id) {
            glfwSetWindowSize(window, width, height);
            glClearColor(0.0f, 0.0f, 0.0f, 1);
            glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

            chart->render(width, height);

            glfwSwapBuffers(window);

#ifdef __EMSCRIPTEN__
            EM_ASM_({
                 window.Module.custom.updateClientCanvas($0);
            }, chart->id);
#endif
            glfwPollEvents();
        }
    }
}

int GL::createChart(int id, Instrument *instrument, int type) {

    Chart *chart = new Chart(id, instrument, window, camera);
    charts.push_back(chart);

    return 0;
}

void GL::getWindowSize(int &width, int &height) {
    glfwGetWindowSize(window, &width, &height);
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

    float sensitivity = 0.05;
    xoffset *= sensitivity;
    yoffset *= sensitivity;

    yaw += xoffset;
    pitch += yoffset;

    if (pitch > 89.0f)
        pitch = 89.0f;
    if (pitch < -89.0f)
        pitch = -89.0f;

    glm::vec3 front;
    front.x = cos(glm::radians(yaw)) * cos(glm::radians(pitch));
    front.y = sin(glm::radians(pitch));
    front.z = sin(glm::radians(yaw)) * cos(glm::radians(pitch));

    camera->Front = glm::normalize(front);
}

void windowSizeCallback(GLFWwindow *window, int width, int height) {

}

void keyCallback(GLFWwindow *window, int key, int scancode, int action, int mods) {
    if (key == GLFW_KEY_ESCAPE) {
#ifndef __EMSCRIPTEN__
//        destroy();
#endif
    }
}

void errorCallback(int error, const char *description) {
    fprintf(stderr, "Error: %s\n", description);
}

void windowCloseCallback(GLFWwindow *window) {
    glfwSetWindowShouldClose(window, GLFW_FALSE);
}

int GL::destroy() {
    //    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    camera->processInput(window);

//    cubes->render();
//    background->render();

    for (auto &chart : charts) {
//         chart->render();
    }

    glfwSwapBuffers(window);
    glfwPollEvents();

    return 0;
}