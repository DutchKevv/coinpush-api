#include "logger.h"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/html5.h>
#endif

using namespace std;

void consoleLog(string text) {
    if (isEmscripten == true) {

#ifdef __EMSCRIPTEN__
        EM_ASM_({
                    var string = "";
                    if (Module.UTF8ToString($0))
                        string = Module.UTF8ToString($0);

                    if (Module.UTF8ArrayToString($0))
                        string = Module.UTF8ArrayToString($0);

                    console.log('WebAssembly: ', string);
                }, text.c_str());
#endif
    } else {
        printf("%s \n", text.c_str());
        // cout << text;
    }
}

void consoleLog(char *text) {
    string sText(text);
    consoleLog(sText);
}

void consoleLog(int text) {
    consoleLog(to_string(text));
}

void consoleLog(float text) {
    consoleLog(to_string(text));
}