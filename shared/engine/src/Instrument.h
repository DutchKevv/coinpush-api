//
// Created by Kewin Brandsma on 22/07/2017.
//

#ifndef ENGINE_INSTRUMENT_H
#define ENGINE_INSTRUMENT_H

#include "../extern/json/json.hpp"

using json = nlohmann::json;

class Instrument {
private:
public:
    Instrument(int id);
    int updateOrders(json &orders);
    int destroy();

    int id;
    json orders;
    json candles;
    json indicators;
};


#endif //ENGINE_INSTRUMENT_H
