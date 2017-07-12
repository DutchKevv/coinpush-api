#include "loadShaders.h"
#include <stdlib.h>
#include <stdio.h>
#include <string>
#include <iostream>
#include <fstream>
#include <vector>
#include <algorithm>
#include <emscripten.h>
#include "../common/logger.h"

using namespace std;

string readFile(const char *filePath) {
    string content = "#version 300 es\n";

    ifstream fileStream(filePath, std::ios::in);

    if(!fileStream.is_open()) {
        string logText = "Could not find file ";
        logText += filePath;

        consoleLog(logText);
        return "";
    }

    string line = "";

    while(!fileStream.eof()) {
        getline(fileStream, line);
        content.append(line + "\n");
    }

    fileStream.close();
    return content;
}


GLuint LoadShader(const char *vertex_path, const char *fragment_path) {
    GLuint vertShader = glCreateShader(GL_VERTEX_SHADER);
    GLuint fragShader = glCreateShader(GL_FRAGMENT_SHADER);

    // Read shaders
    string vertShaderStr = readFile(vertex_path);
    string fragShaderStr = readFile(fragment_path);
    const char *vertShaderSrc = vertShaderStr.c_str();
    const char *fragShaderSrc = fragShaderStr.c_str();

    GLint result = GL_FALSE;
    int logLength;
    GLint Result = GL_FALSE;

    // Compile vertex shader
    glShaderSource(vertShader, 1, &vertShaderSrc, NULL);
    glCompileShader(vertShader);

    // Check vertex shader
    glGetShaderiv(vertShader, GL_COMPILE_STATUS, &Result);
    glGetShaderiv(vertShader, GL_INFO_LOG_LENGTH, &logLength);
    if ( logLength > 0 ){
        std::vector<char> VertexShaderErrorMessage(logLength+1);
        glGetShaderInfoLog(vertShader, logLength, NULL, &VertexShaderErrorMessage[0]);
        consoleLog(&VertexShaderErrorMessage[0]);
        // printf("%s\n", &VertexShaderErrorMessage[0]);
    }

    // Compile fragment shader
    glShaderSource(fragShader, 1, &fragShaderSrc, NULL);
    glCompileShader(fragShader);

    // Check Fragment Shader
    glGetShaderiv(fragShader, GL_COMPILE_STATUS, &Result);
    glGetShaderiv(fragShader, GL_INFO_LOG_LENGTH, &logLength);
    if ( logLength > 0 ){
        std::vector<char> FragmentShaderErrorMessage(logLength+1);
        glGetShaderInfoLog(fragShader, logLength, NULL, &FragmentShaderErrorMessage[0]);
        consoleLog(&FragmentShaderErrorMessage[0]);
        //printf("%s\n", &FragmentShaderErrorMessage[0]);
    }

    GLuint program = glCreateProgram();
    glAttachShader(program, vertShader);
    glAttachShader(program, fragShader);
    glLinkProgram(program);

    // Check the program
    glGetProgramiv(program, GL_LINK_STATUS, &Result);
    glGetProgramiv(program, GL_INFO_LOG_LENGTH, &logLength);
    if ( logLength > 0 ){
        std::vector<char> ProgramErrorMessage(logLength+1);
        glGetProgramInfoLog(program, logLength, NULL, &ProgramErrorMessage[0]);
        consoleLog(&ProgramErrorMessage[0]);
        // printf("%s\n", &ProgramErrorMessage[0]);
    }

    glDeleteShader(vertShader);
    glDeleteShader(fragShader);

    return program;
}