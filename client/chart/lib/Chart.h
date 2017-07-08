// A2DD.h
#ifndef CHART_H
#define CHART_H

using namespace std;

class Chart {
private:
    string id;
    char* canvasId;
    string symbol;
    string timeFrame;
    string from;
    string until;

    EMSCRIPTEN_WEBGL_CONTEXT_HANDLE context;

    void init();
    void bindCanvas();
    void setAsCurrentContext();
    void drawGrid();
    void render();

public:
    Chart(const string &id, const string &canvasId): id(), canvasId(){printf("DONE DONE DONE±");}
    void update(){};

};

#endif