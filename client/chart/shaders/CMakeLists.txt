set(load_shaders_dynamically true)

if (load_shaders_dynamically)
    set(include_dir)
    set(destination_dir ${CMAKE_BINARY_DIR}/shaders)
else()
    set(include_dir ${CMAKE_BINARY_DIR}/include)
    set(destination_dir ${include_dir}/shaders)
endif()


set(
        bootstrap_shaders_files
        TriangleFragment.glsl
        TriangleVertex.glsl
        # list shader files here.
)


add_custom_target(
        shaders
        COMMAND ${CMAKE_COMMAND}
        -DLOAD_SHADERS_DYNAMICALLY=${load_shaders_dynamically}
        -DSOURCE_DIR=${CMAKE_CURRENT_SOURCE_DIR}
        -DFILES="${bootstrap_shaders_files}"
        -DDESTINATION_DIR=${destination_dir}
        -P ../cmake/shaders.cmake
        COMMENT "Creating the files to include the GLSL shaders"
)


set(
        SHADERS_INCLUDE_DIRS
        ${include_dir}
        CACHE INTERNAL
        "Include directories for the shaders"
)