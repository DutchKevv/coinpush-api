#include <string>
#include <stdlib.h>
#include <stdio.h>
#include <GL/glut.h>
#include <GL/glew.h>
#include <emscripten/bind.h>
#include <emscripten/html5.h>
#include "Chart.h"

using namespace emscripten;
using namespace std;

int width = 1024;
int height = 800;
int squareSize = 50;
int backgroundColor[] = {0, 0, 0, 1};
int gridColor[] = {50, 50, 50, 1};


Chart::Chart(const string &id, const string &canvasId): id(), canvasId() {
    printf("DONE DONE DONE±");

    this->init();
}

void Chart::init() {
    this->bindCanvas();
    this->setAsCurrentContext();
    this->drawGrid();

}

void Chart::update() {
    this->drawGrid();
}

void Chart::bindCanvas() {
//        EM_ASM(
//                var canvas2 = document.getElementById('customCanvas');
//                canvas2.parentElement.removeChild(canvas2);
//        );

    EmscriptenWebGLContextAttributes attrs;
    this->context = emscripten_webgl_create_context(this->canvasId, &attrs);
}

void Chart::setAsCurrentContext() {
    if (emscripten_webgl_get_current_context() != this->context) {
        emscripten_webgl_make_context_current(this->context);
    }
}

void Chart::render(void) {

}

void Chart::drawGrid(void) {
    glColor4f(gridColor[0], gridColor[1], gridColor[2], gridColor[3]);

    // Horizontal lines
    int offset = 0;
    while ((offset += squareSize) < height) {
        glBegin(GL_LINES);
        glVertex2f(width, offset);
        glVertex2f(0, offset);
        glEnd();
    }

    // Vertical lines
    offset = 0;
    while ((offset += squareSize) < width) {
        glBegin(GL_LINES);
        glVertex2f(offset, height);
        glVertex2f(offset, 0);
        glEnd();
    }
}