cmake_minimum_required(VERSION 3.8 FATAL_ERROR)
project(StockTrading)

include(/Users/kewinbrandsma/Projects/Engine/CMakeLists.txt)

set(CMAKE_CXX_STANDARD 11)
#set(CMAKE_BUILD_TYPE_INIT "Release")
set(CMAKE_MODULE_PATH ${PROJECT_SOURCE_DIR}/cmake)



set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${PROJECT_SOURCE_DIR}/cmake")
set(SOURCE_FILES
        main.cpp
        ./src/renderObjects/chart.h ./src/renderObjects/chart.cpp
        ./src/dataObjects/instrument.h ./src/dataObjects/instrument.cpp
        )

include_directories(
        ~/Projects/Engine/include
        ~/Projects/Engine/extern
        /emscripten/
        /emscripten/emscripten/incoming/system/include)

add_executable(StockTrading ${SOURCE_FILES})
set_target_properties(StockTrading PROPERTIES LINKER_LANGUAGE CXX)
target_link_libraries(StockTrading Engine)

if (${CMAKE_SYSTEM_NAME} MATCHES "Emscripten")
    set_target_properties(StockTrading PROPERTIES LINK_FLAGS "-o dist/engine.js -s USE_GLFW=3 -s TOTAL_MEMORY=167772160 -s USE_FREETYPE=1 -s OUTLINING_LIMIT=2000 -s DISABLE_EXCEPTION_CATCHING=0 -s NO_EXIT_RUNTIME=1 -s DEMANGLE_SUPPORT=1 -s SAFE_HEAP=1 --bind -s WASM=1 -O2 -s LEGACY_GL_EMULATION=0  -s GL_UNSAFE_OPTS=0 --pre-js pre-module.js --post-js post-module.js -s ASSERTIONS=1 -s GL_ASSERTIONS=1 -s INVOKE_RUN=0  -std=c++11 -s USE_WEBGL2=1 -s FULL_ES3=1 -s GL_DEBUG=1 -s OFFSCREENCANVAS_SUPPORT=1 --preload-file assets")
else ()
    target_link_libraries(StockTrading assimp ${OPENGL_gl_LIBRARY} ${GLEW_LIBRARY} glfw freetype ${GLM_LIBRARY})
endif ()

file(COPY ${CMAKE_CURRENT_SOURCE_DIR}/assets DESTINATION ${CMAKE_CURRENT_BINARY_DIR})
