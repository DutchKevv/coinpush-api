//
// Created by Kewin Brandsma on 17/07/2017.
//
#pragma once

#include "GL/glew.h"
#include "GLFW/glfw3.h"
#include "../dataObjects/Instrument.h"
#include <engine/text.h>

#include <engine/baseRenderObj.h>
#include <engine/context.h>

class Chart : public BaseRenderObj {
private:
//    Text *text;
    unsigned int VAO[3];
    unsigned int VBO[3];

    float offset_x = 0;
    float scale_x = 1;
    int pointsLength = 0;
    Instrument* instrument;


    glm::mat4 viewportTransform(float x, float y, float width, float height, float *pixel_x = 0, float *pixel_y = 0);

public:
    Chart(Instrument* instrument, int type);

    int init();
    int draw();
    int renderScene(Shader &shader, bool isShaderRender);
    int checkKeys();
    int destroy();
    int border = 10;
    float lineColor[4] = { 1, 0, 0, 1 }; // red
    float borderColor[4] = { 0.9f, 0.9f, 0.9f, 1 }; // grey
    bool isFocused = true;

    int ticksize = 10;
};
