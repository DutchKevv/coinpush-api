//
// Created by Kewin Brandsma on 22/07/2017.
//

#pragma once

#include "../../extern/json/json.hpp"
#include <engine/baseDataObj.h>

using json = nlohmann::json;

class Instrument : public BaseDataObj {
private:
public:
    Instrument();
    virtual int update(json data);
    int destroy();

    int id;
    json orders;
    json candles;
    json indicators;
};