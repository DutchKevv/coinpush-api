//
// Created by Kewin Brandsma on 28/07/2017.
//

#include "Level.h"
#include "../extern/stb_image.h"
#include "logger.h"
#include "common/Shader.h"
#include "GL/glew.h"
#include "GLFW/glfw3.h"

#include "../extern/glm/glm.hpp"
#include "../extern/glm/gtc/matrix_transform.hpp"
#include "../extern/glm/gtc/type_ptr.hpp"
#include "Model.h"

static GLuint VertexArrayID;
static GLuint vertexbuffer;
static GLuint uniTransform;

static Shader *shader;
static Shader *modelShader;

static unsigned int VBO, VAO, grassTexture, boulderTexture;
static unsigned int vertexColorLocation;
static unsigned int vertexPosLocation;
static unsigned int textureLocation;
static unsigned int modelLoc;
static unsigned int viewLoc;
static unsigned int projLoc;

int loadTexture(char *fileName);

static float vertices[] = {
        500.0f, -0.0f,  500.0f,  500.0f, 0.0f,
        -500.0f, -0.0f,  500.0f,  0.0f, 0.0f,
        -500.0f, -0.0f, -500.0f,  0.0f, 500.0f,

        500.0f, -0.0f,  500.0f,  500.0f, 0.0f,
        -500.0f, -0.0f, -500.0f,  0.0f, 500.0f,
        500.0f, -0.0f, -500.0f,  1.0f, 1.0f
};

static glm::vec3 boulderPositions[] = {
        glm::vec3( 0.0f,  0.0f,  0.1f),
        glm::vec3( 20.0f,  0.0f, 10.2f),
        glm::vec3(-10.5f, 0.0f, -30.3f),
        glm::vec3(-30.8f, 0.0f, -20.4f),
        glm::vec3( 20.4f, 0.0f, 30.5f),
        glm::vec3(-10.7f,  0.0f, 40.6f),
        glm::vec3( 10.3f,  0.0f, 20.7f),
        glm::vec3( 10.5f,  0.0f, -40.8f),
        glm::vec3( 10.5f,  0.0f, 0.9f),
        glm::vec3(-10.3f,  0.0f, 60.0f)
};

static glm::vec3 treePositions[] = {
        glm::vec3( 60.0f,  0.0f,  0.1f),
        glm::vec3(-20.0f,  0.0f, 60.2f),
        glm::vec3(-10.5f, 0.0f, -10.3f),
        glm::vec3(30.8f, 0.0f, -80.4f),
        glm::vec3(- 20.4f, 0.0f, 0.5f),
        glm::vec3(10.7f,  0.0f, 10.6f),
        glm::vec3( -10.3f,  0.0f, 50.7f),
        glm::vec3( -10.5f,  0.0f, -10.8f),
        glm::vec3( 20.5f,  0.0f, 0.9f),
        glm::vec3(-30.3f,  0.0f, 40.0f),

        glm::vec3(60.0f,  0.0f,  40.1f),
        glm::vec3(20.0f,  0.0f, 20.2f),
        glm::vec3(10.5f, 0.0f, -80.3f),
        glm::vec3(-30.8f, 0.0f, -20.4f),
        glm::vec3(20.4f, 0.0f, 80.5f),
        glm::vec3(-10.7f,  0.0f, 100.6f),
        glm::vec3(10.3f,  0.0f, 10.7f),
        glm::vec3(10.5f,  0.0f, -10.8f),
        glm::vec3(-20.5f,  0.0f, 100.9f),
        glm::vec3(30.3f,  0.0f, 40.0f)
};

static glm::vec3 blenderPositions[] = {
        glm::vec3(-60.0f,  10.0f,  0.1f),
        glm::vec3(20.0f,  10.0f, -60.2f),
        glm::vec3(10.5f, 10.0f, 10.3f),
        glm::vec3(-30.8f, 10.0f, 80.4f),
        glm::vec3(20.4f, 10.0f, -0.5f),
        glm::vec3(-10.7f,  10.0f, -10.6f),
        glm::vec3(10.3f,  10.0f, -50.7f),
        glm::vec3(10.5f,  10.0f, 100.8f),
        glm::vec3(-20.5f,  10.0f, 0.9f),
        glm::vec3(30.3f,  10.0f, -40.0f)
};

static glm::vec3 planePositions[] = {
        glm::vec3( 60.0f,  0.0f,  0.1f),
        glm::vec3(-20.0f,  0.0f, 60.2f)
};

Model *blenderModel;
Model *boulderModel;
Model *treeModel;
Model *planeModel;
Model *worldModel;

Level::Level(GLFWwindow *window, Camera *camera): window(window), camera(camera) {

}

int Level::render() {

    shader->use();

    glBindVertexArray(VAO);
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, grassTexture);

    // create transformations
    glm::mat4 model;
    glm::mat4 view;
    glm::mat4 projection;
    glm::mat4 trans;

    // model = glm::rotate(model, (float)glfwGetTime() * glm::radians(50.0f), glm::vec3(0.5f, 1.0f, 0.0f));
    view = glm::lookAt(camera->Position, camera->Position + camera->Front, camera->Up);
    projection = glm::perspective(glm::radians(45.0f), (float)1024 / (float)800, 0.1f, 100.0f);

    // camera/view transformation
    shader->setMat4("projection", projection);
    shader->setMat4("view", view);
    shader->setMat4("model", model);

    glDrawArrays(GL_TRIANGLES, 0, 6);

    glBindVertexArray(0);
    glActiveTexture(GL_TEXTURE0);
//    model = glm::scale(model, glm::vec3( 0.1f,  0.1f,  0.01f));
//    shader->setMat4("model", model);

//    glBindTexture(GL_TEXTURE_2D, boulderTexture);

    modelShader->use();

//    glBindVertexArray(VAO);
//    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, grassTexture);

    // camera/view transformation
    modelShader->setMat4("projection", projection);
    modelShader->setMat4("view", view);
    modelShader->setMat4("model", model);
    worldModel->Draw(modelShader);


    // Boulders
    for(unsigned int i = 0; i < 10; i++) {
        glm::mat4 model;
        model = glm::translate(model, boulderPositions[i]);
        model = glm::rotate(model, i * glm::radians(50.0f), glm::vec3(1.0f, 0.0f, 0.0f));
        model = glm::scale(model, glm::vec3( 0.1f,  0.1f,  0.1f));
        modelShader->setMat4("model", model);

        boulderModel->Draw(modelShader);
    }

//    glActiveTexture(GL_TEXTURE0);
//    glBindTexture(GL_TEXTURE_2D, boulderTexture);

    // Trees
    for(unsigned int i = 0; i < 20; i++) {
        glm::mat4 model;
        model = glm::translate(model, treePositions[i]);
//        model = glm::rotate(model, (float)glfwGetTime() * glm::radians(50.0f), glm::vec3(1.0f, 0.3f, 0.5f));
        model = glm::scale(model, glm::vec3( 0.3f,  0.3f,  0.3f));
        modelShader->setMat4("model", model);

       treeModel->Draw(modelShader);
    }

    // Planes
    for(unsigned int i = 0; i < 10; i++) {
        glm::mat4 model;
        model = glm::translate(model, planePositions[i]);
//        model = glm::rotate(model, (float)glfwGetTime() * glm::radians(50.0f), glm::vec3(1.0f, 0.3f, 0.5f));
        model = glm::scale(model, glm::vec3( 0.3f,  0.3f,  0.3f));
        modelShader->setMat4("model", model);

        planeModel->Draw(modelShader);
    }

    // Blenders
    for(unsigned int i = 0; i < 10; i++) {
        glm::mat4 model;
        model = glm::translate(model, blenderPositions[i]);
//        model = glm::rotate(model, (float)glfwGetTime() * glm::radians(50.0f), glm::vec3(1.0f, 0.3f, 0.5f));
        model = glm::scale(model, glm::vec3( 0.3f,  0.3f,  0.3f));
        modelShader->setMat4("model", model);

        blenderModel->Draw(modelShader);
    }


    glActiveTexture(GL_TEXTURE0);

    return 0;
}

int Level::build() {

    /* FLOOR */
    shader = new Shader("assets/shaders/TriangleVertex.glsl", "assets/shaders/TriangleFragment.glsl");

    shader->use();

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

    grassTexture = loadTexture("assets/textures/grass.jpg");
    boulderTexture = loadTexture("assets/textures/boulder.jpg");

    boulderModel = new Model("assets/models/newboulder.obj");
    planeModel = new Model("assets/models/flyhigh.obj");
    blenderModel = new Model("assets/models/BLENDERMAN!.obj");
    treeModel = new Model("assets/models/pointree.obj");
    worldModel = new Model("assets/models/world_.obj");

    modelShader = new Shader("assets/shaders/model.v.glsl", "assets/shaders/model.f.glsl");

    return 0;
}

void loadFloor() {

}

int loadTexture(char *fileName) {
    unsigned int texture;

    glGenTextures(1, &texture);
    glBindTexture(GL_TEXTURE_2D, texture);
// set the texture wrapping/filtering options (on the currently bound texture object)
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
// load and generate the texture

    int width, height, nrChannels;
    unsigned char *data = stbi_load(fileName, &width, &height, &nrChannels, 0);

    if (data) {
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, data);
        glGenerateMipmap(GL_TEXTURE_2D);
    }
    else {
        consoleLog("Failed to load texture");
    }

    stbi_image_free(data);

    return texture;
}