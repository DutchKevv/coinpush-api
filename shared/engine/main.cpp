#include <string>
#include "src/Chart.h"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

#include <list>
#include "src/logger.h"
#include "src/Engine.h"
#include "extern/json/json.hpp"

using namespace std;
using json = nlohmann::json;

Engine *engine;

int main();

void destroy();

int main() {
    consoleLog("init");

#ifndef __EMSCRIPTEN__
    engine = new Engine();
    engine->initGL();

#endif

    return 0;
}

void destroy() {
    engine->destroy();
}

#ifdef __EMSCRIPTEN__

extern "C" {

EMSCRIPTEN_KEEPALIVE int _init() {
    engine = new Engine();
    engine->initGL();

    return 0;
}

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
#endif