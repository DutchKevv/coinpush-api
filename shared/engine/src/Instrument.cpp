//
// Created by Kewin Brandsma on 22/07/2017.
//

#include "Instrument.h"
#include "../extern/json/json.hpp"
#include "logger.h"

Instrument::Instrument(int id): id(id) {}

int Instrument::updateOrders(json &_orders) {
    orders = _orders;

    return 0;
}

int Instrument::destroy() {
    orders = NULL;
    return 0;
}