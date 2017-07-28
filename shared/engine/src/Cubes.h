//
// Created by Kewin Brandsma on 17/07/2017.
//

#ifndef ENGINE_CUBES_H
#define ENGINE_CUBES_H

#include "Camera.h"

class Cubes {
private:
    GLFWwindow *window;
    Camera *camera;

    int setup();
public:
    Cubes(GLFWwindow *window, Camera *camera);
    int render();
    int move();
    int destroy();
};


#endif //ENGINE_CUBES_H
