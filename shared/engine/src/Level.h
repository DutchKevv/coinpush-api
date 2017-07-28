//
// Created by Kewin Brandsma on 28/07/2017.
//

#ifndef ENGINE_LEVEL_H
#define ENGINE_LEVEL_H


#include "Camera.h"

class Level {
private:
    GLFWwindow *window;
    Camera *camera;
public:
    Level(GLFWwindow *window, Camera *camera);
    int build();
    int render();
};


#endif //ENGINE_LEVEL_H
