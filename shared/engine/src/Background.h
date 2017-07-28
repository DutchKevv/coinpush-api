//
// Created by Kewin Brandsma on 17/07/2017.
//

#ifndef ENGINE_BACKGROUND_H
#define ENGINE_BACKGROUND_H

#include "GL/glew.h"
#include <GLFW/glfw3.h>
#include "Camera.h"
#include "Text.h"

class Background {
private:
    GLFWwindow *window;
    Camera *camera;

    int setup();
public:
    Background(GLFWwindow *window, Camera *camera);
    int render();
    int move();
    int destroy();
};


#endif //ENGINE_BACKGROUND_H
