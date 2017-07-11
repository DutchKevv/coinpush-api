// A2DD.h
#ifndef CHART_H
#define CHART_H

#include <emscripten.h>
#include <emscripten/html5.h>

using namespace std;

class Chart {
private:
    string id;
    char* canvasId;
    string symbol;
    string timeFrame;
    string from;
    string until;

    int width = 100;
    int height = 100;
    int squareSize = 50;
    int backgroundColor[4] = {0, 0, 0, 1};
    int gridColor[4] = {50, 50, 50, 1};


    EMSCRIPTEN_WEBGL_CONTEXT_HANDLE context;
    int programID;
    GLuint triangleVertexBuffer;
    GLuint triangleVertexArrayId;

    GLuint gridVertexBuffer;
    GLuint gridVertexArrayId;

    int init();
    void createContext();
    void setCurrentContext();
    void drawGrid();
    // void startKeyPressUpdateLoop(char *type, int num);
    void updateZoomAndPan();

public:
    Chart(char* id, char* canvasId, int width, int height);
    void render();
    void onKeyDown(int key);
    void onKeyUp(int key);
};

#endif