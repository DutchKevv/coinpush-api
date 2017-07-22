//
// Created by Kewin Brandsma on 20/07/2017.
//

#ifndef CHART_ENGINE_H
#define CHART_ENGINE_H


#include "GL.h"
#include "../extern/json/json.hpp"
#include "Instrument.h"

using json = nlohmann::json;

class Engine {
private:
public:
    GL *gl;
    Engine();
    int initGL();
    int addInstrument(int id);
    int updateInstrument(int id, json data);
    Instrument* getInstrumentById(int id);
    int render();
    int destroy();
};


#endif //CHART_ENGINE_H
