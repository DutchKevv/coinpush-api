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
                    var string = "";
                    if (Module.UTF8ToString($0))
                        string = Module.UTF8ToString($0);

                    if (Module.UTF8ArrayToString($0))
                        string = Module.UTF8ToString($0);

                    console.info(string);
                }, text.c_str());
#endif
    } else {
        // cout << text;
    }
}