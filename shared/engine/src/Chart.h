//
// Created by Kewin Brandsma on 17/07/2017.
//

#ifndef ENGINE_CHART_H
#define ENGINE_CHART_H

#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include "Camera.h"
#include "Instrument.h"

class Chart {
private:
    GLFWwindow *window;
    Camera *camera;
    GLuint VAO[3];
    GLuint VBO[3];
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

    int render(int windowWidth = NULL, int windowHeight = NULL);
    int checkKeys();
    int destroy();
    int initResources();
    Chart* getChartById(int id);
    int border = 10;
    GLfloat lineColor[4] = { 1, 0, 0, 1 }; // red
    GLfloat borderColor[4] = { 0.9f, 0.9f, 0.9f, 1 }; // grey

    int ticksize = 10;
};


#endif //ENGINE_CHART_H
