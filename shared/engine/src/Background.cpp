//
// Created by Kewin Brandsma on 17/07/2017.
//

#include <iostream>
#include <cmath>

#define GLM_FORCE_RADIANS
#include "../extern/glm/glm.hpp"
#include "../extern/glm/gtc/matrix_transform.hpp"
#include "../extern/glm/gtc/type_ptr.hpp"
#include "common/Shader.h"
#include "../extern/stb_image.h"
#include "Background.h"
#include "Text.h"

#include "GL/glew.h"
#include "GLFW/glfw3.h"

static GLuint VertexArrayID;
static GLuint vertexbuffer;
static GLuint uniTransform;

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

Background::Background(GLFWwindow *window, Camera *camera): window(window), camera(camera) {
    this->setup();
};

int Background::setup() {

    shader = new Shader("assets/shaders/TriangleVertex.glsl", "assets/shaders/TriangleFragment.glsl");
    shader->use();

    vertexColorLocation = glGetUniformLocation(shader->ID, "aColor");
    vertexPosLocation = glGetUniformLocation(shader->ID, "xOffset");
    uniTransform = glGetUniformLocation(shader->ID, "transform");
    modelLoc = glGetUniformLocation(shader->ID, "model");
    viewLoc  = glGetUniformLocation(shader->ID, "view");
    projLoc  = glGetUniformLocation(shader->ID, "projection");

    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);

    // bind the Vertex Array Object first, then bind and set vertex buffer(s), and then configure vertex attributes(s).
    glBindVertexArray(VAO);

    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);

    glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void*)(3* sizeof(float)));
    glEnableVertexAttribArray(2);

    // note that this is allowed, the call to glVertexAttribPointer registered VBO as the vertex attribute's bound vertex buffer object so afterwards we can safely unbind
    glBindBuffer(GL_ARRAY_BUFFER, 0);

    // You can unbind the VAO afterwards so other VAO calls won't accidentally modify this VAO, but this rarely happens. Modifying other
    // VAOs requires a call to glBindVertexArray anyways so we generally don't unbind VAOs (nor VBOs) when it's not directly necessary.
    glBindVertexArray(0);

    glGenTextures(1, &texture);
    glBindTexture(GL_TEXTURE_2D, texture);
// set the texture wrapping/filtering options (on the currently bound texture object)
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
// load and generate the texture

    int width, height, nrChannels;
    unsigned char *data = stbi_load("assets/textures/background_1.png", &width, &height, &nrChannels, 0);

    if (data) {
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, data);
        glGenerateMipmap(GL_TEXTURE_2D);
    }
    else {
        consoleLog("Failed to load texture");
    }

    stbi_image_free(data);

    glBindBuffer(GL_ARRAY_BUFFER, 0);
    glBindVertexArray(0);

    return 0;
};

int Background::render() {
    shader->use();

    glBindVertexArray(VAO);
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, texture);

    // create transformations
    glm::mat4 model;
    glm::mat4 view;
    glm::mat4 projection;
    glm::mat4 trans;

    // model = glm::rotate(model, (float)glfwGetTime() * glm::radians(50.0f), glm::vec3(0.5f, 1.0f, 0.0f));
    view = glm::lookAt(camera->Position, camera->Position + camera->Front, camera->Up);
    projection = glm::perspective(glm::radians(90.0f), (float)1024 / (float)800, 0.1f, 100.0f);

    // camera/view transformation
    glUniformMatrix4fv(projLoc, 1, GL_FALSE, glm::value_ptr(projection));
    glUniformMatrix4fv(viewLoc, 1, GL_FALSE, glm::value_ptr(view));

    model = glm::rotate(model, 0.0f, glm::vec3(1.0f, 0.3f, 0.5f));
    glUniformMatrix4fv(modelLoc, 1, GL_FALSE, glm::value_ptr(model));

    glDrawArrays(GL_TRIANGLES, 0, 6);

    glBindVertexArray(0);

    return 0;
};

int Background::destroy() {
    // Cleanup VBO
    glDeleteBuffers(1, &vertexbuffer);
    glDeleteVertexArrays(1, &VertexArrayID);
    shader->destroy();
    return 0;
};