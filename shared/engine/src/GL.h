//
// Created by Kewin Brandsma on 20/07/2017.
//

#ifndef ENGINE_GL_H
#define ENGINE_GL_H


#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include "Instrument.h"

class GL {
private:
    bool dirty = true;
public:
    int windowWidth;
    int windowHeight;
    int focusedId;

    GLFWwindow *window;
    GL();

    int initOpenGLWindow();
    void render();
    void renderTest();
    void renderSingle(int id, int width, int height);
    int createChart(int id, Instrument* instrument, int type);

    void getWindowSize(int &width, int &height);
    int destroy();
};


#endif //ENGINE_GL_H
