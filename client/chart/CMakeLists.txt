    cmake_minimum_required(VERSION 3.7)
    project(Chart)
    set(CMAKE_CXX_STANDARD 11)
    set(GLFW_BUILD_DOCS OFF CACHE BOOL "" FORCE)
    set(GLFW_BUILD_TESTS OFF CACHE BOOL "" FORCE)
    set(GLFW_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)

    file(GLOB RES_FILES shaders/*.glsl)
    set(RES_FILES src/common/logger.cpp src/common/logger.h)
    add_executable(Chart
            src/main.cpp
            ${RES_FILES}
            src/common/loadShaders.cpp
            src/common/loadShaders.h
            src/common/loadShaders.cpp
            src/common/loadShaders.h
            )

    find_package(glfw3 REQUIRED)
    find_package(OpenGL REQUIRED)
    find_package(GLEW REQUIRED)
    link_libraries(${GLEW_LIBRARIES})

    add_definitions(${GLEW_DEFINITIONS})
    #    add_library(src
    #            ./src/shaders/TriangleFragment.glsl
    #            ./src/shaders/TriangleVertex.glsl
    #    )

    target_include_directories(Chart PUBLIC ${OPENGL_INCLUDE_DIR} ${GLEW_INCLUDE_DIRS})
    target_link_libraries(Chart ${OPENGL_gl_LIBRARY} glfw ${GLEW_LIBRARIES})
    #    include_directories(src)

    add_subdirectory(shaders)
    #    add_subdirectory(src)

    include_directories(/usr/local/include/)
    include_directories(src/common)
    include_directories(/emscripten/)
    include_directories(/emscripten/emscripten/incoming/system/include)

    link_directories(/usr/local/lib/ shaders src/common)