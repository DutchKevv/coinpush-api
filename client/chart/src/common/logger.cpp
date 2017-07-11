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

void consoleLog(string text) {
    if (isEmscripten == true) {
        printf("%s \n", text.c_str());
#ifdef __EMSCRIPTEN__
        EM_ASM_({
                    console.info(Module.UTF8ToString($0));
                }, text.c_str());
#endif
    } else {
        // cout << text;
    }
}