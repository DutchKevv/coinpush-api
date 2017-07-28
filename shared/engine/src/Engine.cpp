//
// Created by Kewin Brandsma on 20/07/2017.
//

#include <list>
#include "Engine.h"
#include "Instrument.h"
#include "../extern/json/json.hpp"
#include "logger.h"


using namespace std;

vector<Instrument *> instruments;

Engine::Engine() {

}

int Engine::initGL() {
    this->gl = new GL();

    return 0;
}

int Engine::addInstrument(int id) {

    Instrument *instrument = new Instrument(id);
    instruments.push_back(instrument);

    return 0;
}

int Engine::updateInstrument(int id, json data) {
    consoleLog((int)data["orders"].size());

    getInstrumentById(id)->updateOrders(data["orders"]);

    return 0;
}

Instrument* Engine::getInstrumentById(int id) {
    for (auto &instrument : instruments) {
        if (instrument->id == id) {
            return instrument;
        }
    }

    return NULL;
}

int Engine::render() {
//    this->gl->render();
    return 0;
}

int Engine::destroy() {
    if (this->gl != NULL) {
        this->gl->destroy();
    }

    for (auto &instrument : instruments) {
        instrument->destroy();
    }

    return 0;
}