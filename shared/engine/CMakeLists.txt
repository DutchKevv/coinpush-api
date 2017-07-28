cmake_minimum_required(VERSION 3.7)
project(Engine)

#set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/dist)
#set(CMAKE_BUILD_TYPE_INIT "Release")
set(CMAKE_MODULE_PATH ${PROJECT_SOURCE_DIR}/cmake)
set(CMAKE_CXX_STANDARD 11)

message(${CMAKE_SYSTEM_NAME})
if (${CMAKE_SYSTEM_NAME} MATCHES "Emscripten")
    set(CMAKE_C_COMPILER "emcc")
endif ()

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${PROJECT_SOURCE_DIR}/cmake")
set(SOURCE_FILES main.cpp extern/stb_image.cpp src/Background.cpp src/Background.h src/Camera.cpp src/Cubes.cpp src/Chart.cpp src/Chart.h src/logger.cpp src/Engine.cpp src/Engine.h src/GL.cpp src/GL.h src/Instrument.cpp src/Text.cpp src/SkyBox.cpp src/Level.cpp src/Level.h src/Mesh.cpp src/Model.cpp)

if (NOT ${CMAKE_SYSTEM_NAME} MATCHES "Emscripten")
    find_package(OPENGL REQUIRED)
    find_package(GLEW REQUIRED)
    find_package(GLFW3 REQUIRED)
    find_package(assimp REQUIRED)
    find_package(freetype REQUIRED)
    find_package(glm REQUIRED)
endif ()

#find_package(freetype REQUIRED)

include_directories(
        /usr/local/include/
        /usr/local/Cellar/freetype/2.8/include/freetype2
        ${GLEW_INCLUDE_DIR}
        ${GLFW_INCLUDE_DIRS}
        ${GLM_INCLUDE_DIRS}
        ${FREETYPE_INCLUDE_DIRS}
)

if (${CMAKE_SYSTEM_NAME} MATCHES "Emscripten")
    include_directories(/emscripten/ /emscripten/emscripten/incoming/system/include)
else()
    include_directories()
endif ()

add_executable(Engine ${SOURCE_FILES})

if (${CMAKE_SYSTEM_NAME} MATCHES "Emscripten")
    set_target_properties(Engine PROPERTIES LINK_FLAGS "-o dist/engine.js -s USE_GLFW=3 -s TOTAL_MEMORY=167772160 -s USE_FREETYPE=1 -s OUTLINING_LIMIT=2000 -s DISABLE_EXCEPTION_CATCHING=0 -s NO_EXIT_RUNTIME=1 -s DEMANGLE_SUPPORT=1 -s SAFE_HEAP=1 --bind -s WASM=1 -O2 -s LEGACY_GL_EMULATION=0  -s GL_UNSAFE_OPTS=0 --pre-js pre-module.js --post-js post-module.js -s ASSERTIONS=1 -s GL_ASSERTIONS=1 -s INVOKE_RUN=0  -std=c++11 -s USE_WEBGL2=1 -s FULL_ES3=1 -s GL_DEBUG=1 -s OFFSCREENCANVAS_SUPPORT=0 --use-preload-plugins --preload-file assets --preload-file assets")
else ()
    target_link_libraries(Engine assimp ${OPENGL_gl_LIBRARY} glew glfw freetype ${GLM_LIBRARY})
endif ()

file(COPY ${CMAKE_CURRENT_SOURCE_DIR}/assets DESTINATION ${CMAKE_CURRENT_BINARY_DIR})
