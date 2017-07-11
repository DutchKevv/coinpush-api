separate_arguments(FILES)

foreach (file ${FILES})
    if (LOAD_SHADERS_DYNAMICALLY)
        file(
                COPY ${SOURCE_DIR}/${file}
                DESTINATION ${DESTINATION_DIR}
        )
    else()
        set(filename ${SOURCE_DIR}/${file})
        get_filename_component(name ${filename} NAME_WE)
        get_filename_component(extension ${filename} EXT)

        set(source "")

        file(STRINGS ${filename} lines)
        foreach (line ${lines})
            set(source "${source}    \"${line}\\n\"\n")
        endforeach()

        file(
                WRITE ${DESTINATION_DIR}/${file}
                "static const GLchar *${name}ShaderSource[] = {\n"
                "${source}"
                "};\n"
        )
    endif()
endforeach()