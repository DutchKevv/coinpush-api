//
// Created by Kewin Brandsma on 17/07/2017.
//

#ifndef ENGINE_CHART_H
#define ENGINE_CHART_H

#include "GL/glew.h"
#include "GLFW/glfw3.h"
#include "Camera.h"
#include "Instrument.h"
#include "Text.h"

class Chart {
private:
    GLFWwindow *window;
    Camera *camera;
    Text *text;
    unsigned int VAO[3];
    unsigned int VBO[3];
//    GLuint vbo[3];
    float offset_x = 0;
    float scale_x = 1;
    int pointsLength = 0;
    Instrument* instrument;


    glm::mat4 viewportTransform(float x, float y, float width, float height, float *pixel_x = 0, float *pixel_y = 0);

public:
    Chart(int id, Instrument* instrument, GLFWwindow *window, Camera *camera);
    int id;
    int width;
    int height;

    int render(int windowWidth = 0, int windowHeight = 0);
    int checkKeys(struct context *ctx);
    int destroy();
    int initResources();
    int border = 10;
    float lineColor[4] = { 1, 0, 0, 1 }; // red
    float borderColor[4] = { 0.9f, 0.9f, 0.9f, 1 }; // grey

    int ticksize = 10;
};


#endif //ENGINE_CHART_H
