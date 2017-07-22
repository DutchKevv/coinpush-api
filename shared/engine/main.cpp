#include <string>
#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include "src/Chart.h"
#include <emscripten.h>
#include <list>
#include "src/logger.h"
#include "src/Engine.h"
#include "extern/json/json.hpp"

using namespace std;
using json = nlohmann::json;

Engine *engine;

int main();

void render();

void destroy();

extern "C" {

EMSCRIPTEN_KEEPALIVE int _addInstrument(int id) {
    engine->addInstrument(id);
    return 0;
}

EMSCRIPTEN_KEEPALIVE int _addChart(int id, int instrumentId, int type) {
    engine->gl->createChart(id, engine->getInstrumentById(instrumentId), type);
    return 0;
}

EMSCRIPTEN_KEEPALIVE int _renderChart(int id, int width, int height, int type) {
    engine->gl->renderSingle(id, width, height);
    return 0;
}

EMSCRIPTEN_KEEPALIVE int _setFocus(int id) {
    engine->gl->focusedId = id;
    return 0;
}

EMSCRIPTEN_KEEPALIVE int _updateInstrumentData(int id, char *data) {
    engine->updateInstrument(id, json::parse(data));
    return 0;
}
}

int main() {
    consoleLog("INIT");

    engine = new Engine();
    engine->initGL();

#ifdef __EMSCRIPTEN__
    emscripten_set_main_loop(render, 0, 1);
#else
    while (!glfwWindowShouldClose(engine->gl->window)) {
        engine->gl->renderTest();
    }
#endif
}

void render() {
    engine->render();
}

//void destroy() {
//    glfwSetWindowShouldClose(window, GLFW_TRUE);
//
//    if (background != NULL) {
//        background->destroy();
//        background = NULL;
//    }
//
//    if (cubes != NULL) {
//        cubes->destroy();
//        cubes = NULL;
//    }
//
//    for (auto &chart : charts) {
//        chart->destroy();
//    }
//    charts.clear();
//
//    glfwTerminate();
//    glfwDestroyWindow(window);
//};