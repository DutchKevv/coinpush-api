#include <engine/engine.h>
#include <engine/renderer.h>
#include <engine/text.h>
#include <engine/baseRenderObj.h>
#include <engine/camera.h>
#include <engine/constants.h>
#include "src/renderObjects/chart.h"
#include "extern/json/json.hpp"
#include <emscripten.h>
#include <emscripten/html5.h>
#include <src/app_world.h>

Engine *engine;
World *appWorld;

using json = nlohmann::json;

int main() {
    return 0;
}

extern "C" {

EMSCRIPTEN_KEEPALIVE int _init() {
    engine = new Engine(ENGINE_TYPE_APP);
    appWorld = new AppWorld();

    engine->renderer->attachWorld(appWorld);
    engine->renderer->startLoop();
    return 0;
}

EMSCRIPTEN_KEEPALIVE int _addInstrument(int id) {
    return engine->addDataObj(new Instrument(), id);
}

EMSCRIPTEN_KEEPALIVE int _addChart(int instrumentId, int type) {
    Chart *chart = new Chart((Instrument *)engine->getDataObjById(instrumentId), type);
    return appWorld->attachRenderObj(chart);
}

EMSCRIPTEN_KEEPALIVE int _renderChart(int id, int width, int height, int type) {
    return appWorld->renderSingleObj(id, width, height);
}

EMSCRIPTEN_KEEPALIVE int _updateInstrumentData(int id, char *data) {
    return engine->updateDataObj(id, json::parse(data));
}

EMSCRIPTEN_KEEPALIVE int _setFocus(int id) {
//    engine->gl->focusedId = id;
    return 0;
}
}