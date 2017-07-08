#include <string>
#include <stdlib.h>
#include <stdio.h>
#include <GL/glut.h>
#include <GL/glew.h>
#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/html5.h>

#include <iostream>
#include "lib/Chart.h"

using namespace emscripten;
using namespace std;

int width = 1024;
int height = 800;
int squareSize = 50;
int backgroundColor[] = {0, 0, 0, 1};
int gridColor[] = {50, 50, 50, 1};
bool GLInitialized = false;

void GLInitialize() {

}

vector<Chart *> charts;

//
void createInstrument(const string &id, const string &canvasId) {
    printf("DONE DONE DONE±");
    Chart *chart = new Chart(id, canvasId);
    charts.push_back(chart);
}

EMSCRIPTEN_BINDINGS(my_module) {
    emscripten::function("createInstrument", &createInstrument);
}

static float rotAngle = 0.;

/*  Initialize antialiasing for RGBA mode, including alpha
 *  blending, hint, and line width.  Print out implementation
 *  specific info on line width granularity and width.
 */
void init(void) {

}

/* Draw 2 diagonal lines to form an X
 */
void display(void) {
    glClear(GL_COLOR_BUFFER_BIT);

    for(auto const& chart: charts) {
        chart->update();
    }

    glFlush();
}

void reshape(int w, int h) {
    glViewport(0, 0, w, h);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    if (w <= h)
        gluOrtho2D(-1.0, 1.0,
                   -1.0 * (GLfloat) h / (GLfloat) w, 1.0 * (GLfloat) h / (GLfloat) w);
    else
        gluOrtho2D(-1.0 * (GLfloat) w / (GLfloat) h,
                   1.0 * (GLfloat) w / (GLfloat) h, -1.0, 1.0);
    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();
}

void keyboard(unsigned char key, int x, int y) {
    switch (key) {
        case 'r':
        case 'R':
            rotAngle += 20.;
            if (rotAngle >= 360.) rotAngle = 0.;
            glutPostRedisplay();
            break;
        case 27:  /*  Escape Key  */
            exit(0);
            break;
        default:
            break;
    }
}

/*  Main Loop
 *  Open window with initial window size, title bar,
 *  RGBA display mode, and handle input events.
 */
int main(int argc, char **argv) {
    // printf(std::to_string(argc));

    if (argc > 2) {
        printf("%s\n", argv[1]);
        width = std::stoi(argv[1]);
        height = std::stoi(argv[2]);
    }

    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_SINGLE | GLUT_RGB);
    glutInitWindowSize(width, height);
    glutCreateWindow(argv[0]);

    GLfloat values[2];
    glGetFloatv(GL_LINE_WIDTH_GRANULARITY, values);
    printf("GL_LINE_WIDTH_GRANULARITY value is %3.1f\n", values[0]);

    glGetFloatv(GL_LINE_WIDTH_RANGE, values);
    printf("GL_LINE_WIDTH_RANGE values are %3.1f %3.1f\n",
           values[0], values[1]);

    glEnable(GL_LINE_SMOOTH);
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    glHint(GL_LINE_SMOOTH_HINT, GL_DONT_CARE);
    glViewport(0, 0, width, height); //in pixels
    //we want to modify the projection matrix (without this, mesh normals will break)
    glMatrixMode(GL_PROJECTION);

//clear any previous transforms the projection matrix may contain (otherwise it would be combined with the following glOrtho matrix)
    glLoadIdentity();

//set the projection (could use glTranslate/glScale but this utility function is simpler)
    glOrtho(0, width, 0, height, -1, 1); //left,right,bottom,top,front,back

//common practice to leave modelview as the current matrix for editing
    glMatrixMode(GL_MODELVIEW);
    glClearColor(backgroundColor[0], backgroundColor[1], backgroundColor[2], backgroundColor[3]);

    glewInit();
    printf("OpenGL version supported by this platform (%s): \n", glGetString(GL_VERSION));
    // glutReshapeFunc (reshape);
    glutKeyboardFunc(keyboard);
    glutDisplayFunc(display);
    glutMainLoop();

    return 0;
}