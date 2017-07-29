//
// Created by Kewin Brandsma on 17/07/2017.
//

#include <iostream>
#include <cmath>
#include "GL/glew.h"
#include "GLFW/glfw3.h"

#define GLM_FORCE_RADIANS
#include "../extern/glm/glm.hpp"
#include "../extern/glm/gtc/matrix_transform.hpp"
#include "../extern/glm/gtc/type_ptr.hpp"
#include "common/Shader.h"
#include "../extern/stb_image.h"
#include "Text.h"
#include <ft2build.h>
#include FT_FREETYPE_H

static int initCommonResources();

static unsigned int VertexArrayID;
static unsigned int vertexbuffer;
static unsigned int uniTransform;

static Shader *shader;

static unsigned int VBO, VAO, texture;
static unsigned int vertexColorLocation;
static unsigned int vertexPosLocation;
static unsigned int textureLocation;
static unsigned int modelLoc;
static unsigned int viewLoc;
static unsigned int projLoc;

static float vertices[] = {
        -1.5f, -1.5f, -1.5f,  0.0f, 0.0f,
        1.5f, -1.5f, -1.5f,  1.0f, 0.0f,
        1.5f,  1.5f, -1.5f,  1.0f, 1.0f,
        1.5f,  1.5f, -1.5f,  1.0f, 1.0f,
        -1.5f,  1.5f, -1.5f,  0.0f, 1.0f,
        -1.5f, -1.5f, -1.5f,  0.0f, 0.0f
};

static FT_Library ft;
static FT_Face face;

static unsigned int program;
static int attribute_coord;
static int uniform_tex;
static int uniform_color;

static const char *fontFilename = "assets/fonts/OpenSans-Bold.ttf";

struct point {
    float x;
    float y;
    float s;
    float t;
};

static GLuint vbo;

static bool commonResourcesLoaded = false;

static int initCommonResources() {
    if (commonResourcesLoaded == false)
        commonResourcesLoaded = true;
    else
        return 0;

    /* Initialize the FreeType2 library */
    if (FT_Init_FreeType(&ft)) {
        consoleLog("Could not init freetype library\n");
        return -1;
    }

    /* Load a font */
    if (FT_New_Face(ft, fontFilename, 0, &face)) {
        consoleLog("Could not open font %s\n");
//        return -1;
    }

    shader = new Shader("assets/shaders/text.v.glsl", "assets/shaders/text.f.glsl");
    shader->use();

    attribute_coord = shader->get_attrib("coord");
    uniform_tex = shader->get_uniform("tex");
    uniform_color = shader->get_uniform("color");

    if(attribute_coord == -1 || uniform_tex == -1 || uniform_color == -1)
        return -1;

    // Create the vertex buffer object
    glGenBuffers(1, &vbo);

    return 0;
};

Text::Text(GLFWwindow *window): window(window) {
    initCommonResources();
};

int Text::render() {
//    int width, height;
//    glfwGetWindowSize(window, &width, &height);
//
//    float sx = 2.0 / width;
//    float sy = 2.0 / height;
//
//    glUseProgram(program);
//
//    glEnable(GL_BLEND);
//    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
//
//    GLfloat black[4] = { 0, 0, 0, 1 };
//    GLfloat red[4] = { 1, 0, 0, 1 };
//    GLfloat transparent_green[4] = { 0, 1, 0, 0.5 };
//
//    /* Set font size to 48 pixels, color to black */
//    FT_Set_Pixel_Sizes(face, 0, 48);
//    glUniform4fv(uniform_color, 1, black);

    return 0;
};

int Text::destroy() {
    // Cleanup VBO
    glDeleteBuffers(1, &vertexbuffer);
    glDeleteVertexArrays(1, &VertexArrayID);
    shader->destroy();
    return 0;
};

int Text::renderText(const char *text, float x, float y, float sx, float sy, GLfloat color[], int size) {
    const char *p;

    shader->use();

    FT_GlyphSlot g = face->glyph;

    /* Enable blending, necessary for our alpha texture */
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

    /* Set font size & color */
    FT_Set_Pixel_Sizes(face, 0, size);
    glUniform4fv(uniform_color, 1, color);

    /* Create a texture that will be used to hold one "glyph" */
    GLuint tex;

    glActiveTexture(GL_TEXTURE0);
    glGenTextures(1, &tex);
    glBindTexture(GL_TEXTURE_2D, tex);
    glUniform1i(uniform_tex, 0);

    /* We require 1 byte alignment when uploading texture data */
    glPixelStorei(GL_UNPACK_ALIGNMENT, 1);

    /* Clamping to edges is important to prevent artifacts when scaling */
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

    /* Linear filtering usually looks best for text */
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

    /* Set up the VBO for our vertex data */
    glEnableVertexAttribArray(attribute_coord);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glVertexAttribPointer(attribute_coord, 4, GL_FLOAT, GL_FALSE, 0, 0);

    /* Loop through all characters */
    for (p = text; *p; p++) {
        /* Try to load and render the character */
        if (FT_Load_Char(face, *p, FT_LOAD_RENDER))
            continue;

        /* Upload the "bitmap", which contains an 8-bit grayscale image, as an alpha texture */
        glTexImage2D(GL_TEXTURE_2D, 0, GL_ALPHA, g->bitmap.width, g->bitmap.rows, 0, GL_ALPHA, GL_UNSIGNED_BYTE, g->bitmap.buffer);

        /* Calculate the vertex and texture coordinates */
        float x2 = x + g->bitmap_left * sx;
        float y2 = -y - g->bitmap_top * sy;
        float w = g->bitmap.width * sx;
        float h = g->bitmap.rows * sy;

        point box[4] = {
                {x2, -y2, 0, 0},
                {x2 + w, -y2, 1, 0},
                {x2, -y2 - h, 0, 1},
                {x2 + w, -y2 - h, 1, 1},
        };

        /* Draw the character on the screen */
        glBufferData(GL_ARRAY_BUFFER, sizeof box, box, GL_DYNAMIC_DRAW);
        glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);

        /* Advance the cursor to the start of the next character */
        x += (g->advance.x >> 6) * sx;
        y += (g->advance.y >> 6) * sy;
    }

    glDisableVertexAttribArray(attribute_coord);
    glDeleteTextures(1, &tex);

    return 0;
}
