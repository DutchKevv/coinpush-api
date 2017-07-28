#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "GL/glew.h"
#include "GLFW/glfw3.h"

#define GLM_FORCE_RADIANS

#include "../extern/glm/glm.hpp"
#include "../extern/glm/gtc/matrix_transform.hpp"
#include "../extern/glm/gtc/type_ptr.hpp"

#include "common/Shader.h"
#include "Chart.h"
#include "Instrument.h"
#include "logger.h"
#include "Text.h"

using namespace std;

struct point {
    GLfloat x;
    GLfloat y;
};

float getHighestValue(json orders);

float getLowestValue(json orders);

void prepareData(Instrument *instrument, point graph[]);

int initCommonResources();

static bool commonResourcesLoaded = false;
static Shader *shader;
static GLint attribute_coord2d;
static GLint uniform_color;
static GLint uniform_transform;
static const point borderObject[4] = {{-1, -1},
                                      {1,  -1},
                                      {1,  1},
                                      {-1, 1}};

static GLuint textVBO;
static GLuint borderVBO;
static GLuint borderVAO;
static GLuint axisVBO;
static GLuint axisVAO;

static GLint attribute_coord;
static GLint uniform_tex;
//static GLint uniform_color;

int initCommonResources() {
    if (commonResourcesLoaded == false)
        commonResourcesLoaded = true;
    else
        return 0;

    shader = new Shader("assets/shaders/graph.v.glsl", "assets/shaders/graph.f.glsl");

    if (shader->ID == 0) {
        consoleLog("Error - Shader returned");
        return -1;
    }

    attribute_coord2d = shader->get_attrib("coord2d");
    uniform_transform = shader->get_uniform("transform");
    uniform_color = shader->get_uniform("color");

    if (attribute_coord2d == -1 || uniform_transform == -1 || uniform_color == -1) {
        consoleLog("ERROR - Could not find ");
        return -1;
    }

    // Border
    glGenBuffers(1, &borderVBO);
    glBindBuffer(GL_ARRAY_BUFFER, borderVBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof borderObject, borderObject, GL_STATIC_DRAW);
    glGenVertexArrays(1, &borderVAO);
    glBindVertexArray(borderVAO);
    glEnableVertexAttribArray(attribute_coord2d);
    glVertexAttribPointer(attribute_coord2d, 2, GL_FLOAT, GL_FALSE, 0, 0);

    // Axis
    glGenBuffers(1, &axisVBO);
    glBindBuffer(GL_ARRAY_BUFFER, axisVBO);
    glGenVertexArrays(1, &axisVAO);
    glBindVertexArray(axisVAO);

    // Create the vertex buffer object
    glGenBuffers(1, &textVBO);

    return 0;
}

Chart::Chart(int id, Instrument *instrument, GLFWwindow *window, Camera *camera) : id(id),
                                                                                               instrument(instrument),
                                                                                               window(window),
                                                                                               camera(camera) {

    this->initResources();
}

int Chart::initResources() {
    initCommonResources();

    int len = instrument->orders.size();

    // Create data
    point graph[len];
    prepareData(instrument, graph);

    pointsLength = len;

    /** ------------------- **/

    glGenBuffers(1, &VBO[0]);
    glBindBuffer(GL_ARRAY_BUFFER, VBO[0]);
    glBufferData(GL_ARRAY_BUFFER, sizeof graph, graph, GL_STATIC_DRAW);
    glGenVertexArrays(1, &VAO[0]);
    glBindVertexArray(VAO[0]);
    glEnableVertexAttribArray(attribute_coord2d);
    glVertexAttribPointer(attribute_coord2d, 2, GL_FLOAT, GL_FALSE, 0, 0);

    /** ------------------- **/

    glBindBuffer(GL_ARRAY_BUFFER, 0);
    glBindVertexArray(0);

    return 0;
}

// Create a projection matrix that has the same effect as glViewport().
// Optionally return scaling factors to easily convert normalized device coordinates to pixels.
//
glm::mat4 Chart::viewportTransform(float x, float y, float width, float height, float *pixel_x, float *pixel_y) {
    // Map OpenGL coordinates (-1,-1) to window coordinates (x,y),
    // (1,1) to (x + width, y + height).

    // Calculate how to translate the x and y coordinates:
    float offset_x = (2.0 * x + (width - this->width)) / this->width;
    float offset_y = (2.0 * y + (height - this->height)) / this->height;

    // Calculate how to rescale the x and y coordinates:
    float scale_x = width / this->width;
    float scale_y = height / this->height;

    // Calculate size of pixels in OpenGL coordinates
    if (pixel_x)
        *pixel_x = 2.0 / width;
    if (pixel_y)
        *pixel_y = 2.0 / height;

    return glm::scale(glm::translate(glm::mat4(1), glm::vec3(offset_x, offset_y, 0)), glm::vec3(scale_x, scale_y, 1));
}

int Chart::render(int windowWidth, int windowHeight) {
    if (windowWidth == 0 || windowHeight == 0) {
        glfwGetWindowSize(window, &windowWidth, &windowHeight);
    }

    this->width = windowWidth;
    this->height = windowHeight;

    float sx = 2.0 / this->width;
    float sy = 2.0 / this->height;

    shader->use();

    /* ---------------------------------------------------------------- */
    /* Draw the graph */

    glViewport(border + ticksize, border + ticksize, windowWidth - border * 2 - ticksize,
               windowHeight - border * 2 - ticksize);

    glScissor(border + ticksize, border + ticksize, windowWidth - border * 2 - ticksize,
              windowHeight - border * 2 - ticksize);
    glEnable(GL_SCISSOR_TEST);

    glBindVertexArray(VAO[0]);
    glBindBuffer(GL_ARRAY_BUFFER, VBO[0]);
    glVertexAttribPointer(attribute_coord2d, 2, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(attribute_coord2d);

    // Set our coordinate transformation matrix
    glm::mat4 transform = glm::translate(glm::scale(glm::mat4(1.0f), glm::vec3(scale_x, 1, 1)),
                                         glm::vec3(offset_x, 0, 0));
    glUniformMatrix4fv(uniform_transform, 1, GL_FALSE, glm::value_ptr(transform));

    // Set line color and draw
    glUniform4fv(uniform_color, 1, lineColor);
    glDrawArrays(GL_LINE_STRIP, 0, pointsLength);

    // Stop clipping
    glViewport(0, 0, windowWidth, windowHeight);
    glDisable(GL_SCISSOR_TEST);


    /* ------ text -------*/

    GLfloat black[4] = {0, 0, 0, 1};
    GLfloat red[4] = {1, 0, 0, 1};
    GLfloat transparent_green[4] = {0, 1, 0, 0.5};

/* Effects of alignment */
    text->renderText("The Quick Brown Fox Jumps Over The Lazy Dog", -1 + 8 * sx, 1 - 50 * sy, sx, sy, red);
//    text->renderText("The Misaligned Fox Jumps Over The Lazy Dog", -1 + 8.5 * sx, 1 - 100.5 * sy, sx, sy,
//                     transparent_green);

    /* ------- text -------*/

    shader->use();

    /* ---------------------------------------------------------------- */
    /* Draw the borders */

    // Calculate a transformation matrix that gives us the same normalized device coordinates as above
    float pixel_x, pixel_y;
    transform = viewportTransform(border + ticksize, border + ticksize, windowWidth - border * 2 - ticksize,
                                  windowHeight - border * 2 - ticksize, &pixel_x, &pixel_y);
    shader->setMat4("transform", transform);

    glBindBuffer(GL_ARRAY_BUFFER, borderVBO);

    // Set border color
    glUniform4fv(uniform_color, 1, borderColor);

//    glBindVertexArray(borderVAO);
    glVertexAttribPointer(attribute_coord2d, 2, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(attribute_coord2d);
    glDrawArrays(GL_LINE_LOOP, 0, 4);

    /* ---------------------------------------------------------------- */
    /* Draw the y tick marks */
    point ticks[42];

    for (int i = 0; i <= 20; i++) {
        float y = -1 + i * 0.1;
        float tickscale = (i % 10) ? 0.5 : 1;

        ticks[i * 2].x = -1;
        ticks[i * 2].y = y;
        ticks[i * 2 + 1].x = -1 - ticksize * tickscale * pixel_x;
        ticks[i * 2 + 1].y = y;
    }

    glBindBuffer(GL_ARRAY_BUFFER, axisVBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof ticks, ticks, GL_DYNAMIC_DRAW);
    glVertexAttribPointer(attribute_coord2d, 2, GL_FLOAT, GL_FALSE, 0, 0);
    glDrawArrays(GL_LINES, 0, 42);

    /* ---------------------------------------------------------------- */
    /* Draw the x tick marks */

    float tickspacing = 0.1 * powf(10, -floor(log10(scale_x)));    // desired space between ticks, in graph coordinates
    float left = -1.0 / scale_x - offset_x;    // left edge, in graph coordinates
    float right = 1.0 / scale_x - offset_x;    // right edge, in graph coordinates
    int left_i = ceil(left / tickspacing);    // index of left tick, counted from the origin
    int right_i = floor(right / tickspacing);    // index of right tick, counted from the origin
    float rem = left_i * tickspacing - left;    // space between left edge of graph and the first tick

    float firsttick = -1.0 + rem * scale_x;    // first tick in device coordinates

    int nticks = right_i - left_i + 1;    // number of ticks to show

    if (nticks > 21)
        nticks = 21;    // should not happen

    for (int i = 0; i < nticks; i++) {
        float x = firsttick + i * tickspacing * scale_x;
        float tickscale = ((i + left_i) % 10) ? 0.5 : 1;

        ticks[i * 2].x = x;
        ticks[i * 2].y = -1;
        ticks[i * 2 + 1].x = x;
        ticks[i * 2 + 1].y = -1 - ticksize * tickscale * pixel_y;
    }

    glBufferData(GL_ARRAY_BUFFER, sizeof ticks, ticks, GL_DYNAMIC_DRAW);
    glVertexAttribPointer(attribute_coord2d, 2, GL_FLOAT, GL_FALSE, 0, 0);
    glDrawArrays(GL_LINES, 0, nticks * 2);

    // And we are done.

    glDisableVertexAttribArray(attribute_coord2d);
    glBindVertexArray(0);

    return 0;
}

int Chart::checkKeys(struct context *ctx) {

    if (glfwGetKey(window, GLFW_KEY_UP) == GLFW_PRESS) {
        scale_x *= 1.5;
        return 1;
    }

    if (glfwGetKey(window, GLFW_KEY_DOWN) == GLFW_PRESS) {
        scale_x /= 1.5;
        return 1;
    }

    if (glfwGetKey(window, GLFW_KEY_LEFT) == GLFW_PRESS) {
        offset_x -= 0.03;
        return 1;
    }

    if (glfwGetKey(window, GLFW_KEY_RIGHT) == GLFW_PRESS) {
        offset_x += 0.03;
        return 1;
    }

    return 0;
}


int Chart::destroy() {
    return 0;
}

float getHighestValue(json orders) {
    float highest = 0;

    for (json &order : orders) {
        if (order.value("y", 0) > highest)
            highest = order.value("y", 0);
    }

    return highest;
}

float getLowestValue(json orders) {
    float lowest = NULL;

    for (json &order : orders) {
        if (lowest == NULL || order.value("y", 0) < lowest)
            lowest = order.value("y", 0);
    }

    return lowest;
}

void prepareData(Instrument *instrument, point graph[]) {
    json orders = instrument->orders;

    float len = orders.size();
    float high = getHighestValue(orders) * 1;
    float low = getLowestValue(orders) * 1;
    float space = high - low;

    int i = 0;
    for (json &order : orders) {
        graph[i].x = i == 0 ? -1 : -1 + ((i / len) * 2);
        graph[i].y = -1 + (((order.value("y", 0) - low) / space) * 2);
        i++;
    }
}
