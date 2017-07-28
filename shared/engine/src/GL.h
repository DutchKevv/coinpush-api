//
// Created by Kewin Brandsma on 20/07/2017.
//

#ifndef ENGINE_GL_H
#define ENGINE_GL_H

#include "GL/glew.h"
#include <GLFW/glfw3.h>
#include "Instrument.h"

/**
 * Set of input states
 */
enum input_state {
    NOTHING_PRESSED = 0,
    UP_PRESSED = 1,
    DOWN_PRESSED = 1<<1,
    LEFT_PRESSED = 1<<2,
    RIGHT_PRESSED = 1<<3
};

/**
 * Context structure that will be passed to the loop handler
 */
struct context {
    GLFWwindow *window;

    /**
     * Rectangle that the owl texture will be rendered into
     */

    enum input_state active_state;

    /**
     * x and y components of owl's velocity
     */
};

class GL {
private:
    bool dirty = true;
public:
    int windowWidth;
    int windowHeight;
    int focusedId = -1;

    context *ctx;

    GL();

    int initOpenGLWindow();
    void render();
    void renderTest();
    void renderSingle(int id, int width, int height);
    int createChart(int id, Instrument* instrument, int type);

    void getWindowSize(int width, int height);
    void setWindowSize(int width, int height);
    int destroy();
};


#endif //ENGINE_GL_H
