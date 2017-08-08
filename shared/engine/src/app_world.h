//
// Created by Kewin Brandsma on 08/08/2017.
//

#pragma once;


#include <engine/world.h>

class AppWorld : public World {
public:
    AppWorld();

    int init();

    int update();

    int draw();

    int renderScene(Shader &shader, bool isShaderRender);

    int destroy();
private:
};
