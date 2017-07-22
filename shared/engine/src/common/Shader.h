/**
 * From the OpenGL Programming wikibook: http://en.wikibooks.org/wiki/OpenGL_Programming
 * This file is in the public domain.
 * Contributors: Sylvain Beucler
 */

#ifndef SHADER_H
#define SHADER_H


#include <stdio.h>
#include <string>
#include <cstdlib>
#include "../../extern/glm/glm.hpp"
#include <GL/glew.h>
#include "../logger.h"

class Shader {
private:
    char *file_read(const char *filename) {
        FILE* in = fopen(filename, "rb");
        if (in == NULL) return NULL;

        int res_size = BUFSIZ;
        char* res = (char*)malloc(res_size);
        int nb_read_total = 0;

        while (!feof(in) && !ferror(in)) {
            if (nb_read_total + BUFSIZ > res_size) {
                if (res_size > 10*1024*1024) break;
                res_size = res_size * 2;
                res = (char*)realloc(res, res_size);
            }
            char* p_res = res + nb_read_total;
            nb_read_total += fread(p_res, 1, BUFSIZ, in);
        }

        fclose(in);
        res = (char*)realloc(res, nb_read_total + 1);
        res[nb_read_total] = '\0';
        return res;
    }

    void print_log(GLuint object) {
        GLint log_length = 0;
        if (glIsShader(object))
            glGetShaderiv(object, GL_INFO_LOG_LENGTH, &log_length);
        else if (glIsProgram(object))
            glGetProgramiv(object, GL_INFO_LOG_LENGTH, &log_length);
        else {
            consoleLog("printlog: Not a shader or a program\n");
            return;
        }

        char *log = (char *) malloc(log_length);

        if (glIsShader(object))
            glGetShaderInfoLog(object, log_length, NULL, log);
        else if (glIsProgram(object))
            glGetProgramInfoLog(object, log_length, NULL, log);

        string sLog(log);
        consoleLog(sLog);

        free(log);
    }

    GLuint create_shader(const char *filename, GLenum type) {
        const GLchar *source = file_read(filename);
        if (source == NULL) {
            string sFilename(filename);
            consoleLog("Error opening %s: " + sFilename);
            perror("");
            return 0;
        }
        GLuint res = glCreateShader(type);
        const GLchar *sources[] = {
                // Define GLSL version
#ifdef __EMSCRIPTEN__
                "#version 300 es\n"  // OpenGL ES 2.0
#else
                "#version 330 core\n"  // OpenGL 3.0
#endif
                ,
                // GLES2 precision specifiers
#ifdef __EMSCRIPTEN__
        // Define default float precision for fragment shaders:
    (type == GL_FRAGMENT_SHADER) ?
    "#ifdef GL_FRAGMENT_PRECISION_HIGH\n"
    "precision highp float;           \n"
    "#else                            \n"
    "precision mediump float;         \n"
    "#endif                           \n"
    : ""
    // Note: OpenGL ES automatically defines this:
    // #define GL_ES
#else
                // Ignore GLES 2 precision specifiers:
                "#define lowp   \n"
                "#define mediump\n"
                "#define highp  \n"
#endif
                ,
                source};
        glShaderSource(res, 3, sources, NULL);
        free((void *) source);

        glCompileShader(res);
        GLint compile_ok = GL_FALSE;
        glGetShaderiv(res, GL_COMPILE_STATUS, &compile_ok);

        if (compile_ok == GL_FALSE) {
            fprintf(stderr, "%s:", filename);
            print_log(res);
            glDeleteShader(res);
            return 0;
        }

        return res;
    }

    GLuint create_program(const char *vertexfile, const char *fragmentfile) {
        GLuint program = glCreateProgram();
        GLuint shader;

        if (vertexfile) {
            shader = create_shader(vertexfile, GL_VERTEX_SHADER);
            if (!shader)
                return 0;
            glAttachShader(program, shader);
        }

        if (fragmentfile) {
            shader = create_shader(fragmentfile, GL_FRAGMENT_SHADER);
            if (!shader)
                return 0;
            glAttachShader(program, shader);
        }

        glLinkProgram(program);
        GLint link_ok = GL_FALSE;
        glGetProgramiv(program, GL_LINK_STATUS, &link_ok);
        if (!link_ok) {
            consoleLog("PROGRAM LINK ERROR");
            print_log(program);
            glDeleteProgram(program);
            return 0;
        }

        return program;
    }

    int create_gs_program(const char *vertexfile, const char *geometryfile, const char *fragmentfile, GLint input,
                          GLint output, GLint vertices) {
        GLuint program = glCreateProgram();
        GLuint shader;

        if (vertexfile) {
            shader = create_shader(vertexfile, GL_VERTEX_SHADER);
            if (!shader)
                return 0;
            glAttachShader(program, shader);
        }

        if (geometryfile) {
            shader = create_shader(geometryfile, GL_GEOMETRY_SHADER);
            if (!shader)
                return 0;
            glAttachShader(program, shader);

            glProgramParameteriEXT(program, GL_GEOMETRY_INPUT_TYPE_EXT, input);
            glProgramParameteriEXT(program, GL_GEOMETRY_OUTPUT_TYPE_EXT, output);
            glProgramParameteriEXT(program, GL_GEOMETRY_VERTICES_OUT_EXT, vertices);
        }

        if (fragmentfile) {
            shader = create_shader(fragmentfile, GL_FRAGMENT_SHADER);
            if (!shader)
                return 0;
            glAttachShader(program, shader);
        }

        glLinkProgram(program);
        GLint link_ok = GL_FALSE;
        glGetProgramiv(program, GL_LINK_STATUS, &link_ok);
        if (!link_ok) {
            consoleLog("PROGRAM LINK ERROR");
            print_log(program);
            glDeleteProgram(program);
            return 0;
        }

        return program;
    }

public:
    GLuint ID;

    Shader(const char *vertexPath, const char *fragmentPath, const char *geometryPath = nullptr) {
        int ID = this->create_program(vertexPath, fragmentPath);

        if (ID > 0)
            this->ID = ID;
    }

    // activate the shader
    // ------------------------------------------------------------------------
    void use() {
        glUseProgram(ID);
    }

    // utility uniform functions
    // ------------------------------------------------------------------------
    void setBool(const std::string &name, bool value) const {
        glUniform1i(glGetUniformLocation(ID, name.c_str()), (int) value);
    }

    // ------------------------------------------------------------------------
    void setInt(const std::string &name, int value) const {
        glUniform1i(glGetUniformLocation(ID, name.c_str()), value);
    }

    // ------------------------------------------------------------------------
    void setFloat(const std::string &name, float value) const {
        glUniform1f(glGetUniformLocation(ID, name.c_str()), value);
    }

    // ------------------------------------------------------------------------
    void setVec2(const std::string &name, const glm::vec2 &value) const {
        glUniform2fv(glGetUniformLocation(ID, name.c_str()), 1, &value[0]);
    }

    void setVec2(const std::string &name, float x, float y) const {
        glUniform2f(glGetUniformLocation(ID, name.c_str()), x, y);
    }

    // ------------------------------------------------------------------------
    void setVec3(const std::string &name, const glm::vec3 &value) const {
        glUniform3fv(glGetUniformLocation(ID, name.c_str()), 1, &value[0]);
    }

    void setVec3(const std::string &name, float x, float y, float z) const {
        glUniform3f(glGetUniformLocation(ID, name.c_str()), x, y, z);
    }

    // ------------------------------------------------------------------------
    void setVec4(const std::string &name, const glm::vec4 &value) const {
        glUniform4fv(glGetUniformLocation(ID, name.c_str()), 1, &value[0]);
    }

    void setVec4(const std::string &name, float x, float y, float z, float w) {
        glUniform4f(glGetUniformLocation(ID, name.c_str()), x, y, z, w);
    }

    // ------------------------------------------------------------------------
    void setMat2(const std::string &name, const glm::mat2 &mat) const {
        glUniformMatrix2fv(glGetUniformLocation(ID, name.c_str()), 1, GL_FALSE, &mat[0][0]);
    }

    // ------------------------------------------------------------------------
    void setMat3(const std::string &name, const glm::mat3 &mat) const {
        glUniformMatrix3fv(glGetUniformLocation(ID, name.c_str()), 1, GL_FALSE, &mat[0][0]);
    }

    // ------------------------------------------------------------------------
    void setMat4(const std::string &name, const glm::mat4 &mat) const {
        glUniformMatrix4fv(glGetUniformLocation(ID, name.c_str()), 1, GL_FALSE, &mat[0][0]);
    }

    void destroy() {
        glDeleteProgram(ID);
    }

    GLint get_attrib(const char *name) {
        GLint attribute = glGetAttribLocation(ID, name);
        if(attribute == -1) {
            string str(name);
            consoleLog("Could not bind attribute " + str);
        }

        return attribute;
    }

    GLint get_uniform(const char *name) {
        GLint uniform = glGetUniformLocation(ID, name);
        if(uniform == -1) {
            string str(name);
            consoleLog("Could not bind uniform " + str);
        }
        return uniform;
    }
};

#endif
