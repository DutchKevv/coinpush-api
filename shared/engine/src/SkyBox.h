//
// Created by Kewin Brandsma on 17/07/2017.
//

#ifndef BACKSPACE_SKYBOX_H
#define BACKSPACE_SKYBOX_H

#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include "Camera.h"
//#include "Camera.h"
#include "common/Shader.h"

class SkyBox {
private:
    GLFWwindow *window;
    Camera *camera;
    Shader *shader;

    int setup();
public:
    SkyBox(GLFWwindow *window, Camera *camera);
    int render();
    int move();
    int destroy();
};


#endif //BACKSPACE_SKYBOX_H
