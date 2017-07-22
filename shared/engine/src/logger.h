#ifndef ENGINE_LOGGER_H
#define ENGINE_LOGGER_H

#include <string>
#include <stdlib.h>
#include <stdio.h>
#include <iostream>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/html5.h>
static bool isEmscripten = true;
#else
static bool isEmscripten = false;
#endif

using namespace std;

void consoleLog(string text);
void consoleLog(char *text);
void consoleLog(int text);
void consoleLog(float text);

#endif