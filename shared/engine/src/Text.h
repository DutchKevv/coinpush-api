//
// Created by Kewin Brandsma on 17/07/2017.
//

#ifndef ENGINE_TEXT_H
#define ENGINE_TEXT_H

#include "GL/glew.h"
#include "GLFW/glfw3.h"

class Text {
private:
    GLFWwindow *window;

    int setup();
public:
    Text(GLFWwindow *window);
    int render();
    int renderText(const char *text, float x, float y, float sx, float sy, float color[], int size = 48);
    int destroy();
};


#endif //ENGINE_TEXT_H
