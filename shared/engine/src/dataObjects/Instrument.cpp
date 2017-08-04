//
// Created by Kewin Brandsma on 22/07/2017.
//

#include "Instrument.h"
#include <engine/logger.h>

#include "../../extern/json/json.hpp"

using json = nlohmann::json;

Instrument::Instrument() : BaseDataObj() {}

int Instrument::update(json data) {
    orders = data["orders"];

    return 0;
}

int Instrument::destroy() {
    orders = NULL;
    return 0;
}