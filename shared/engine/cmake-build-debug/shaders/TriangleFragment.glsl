in vec3 v_color;
in vec2 texCoordinates;

out vec4 colorOut;

uniform sampler2D uTexture;

void main() {
    colorOut = texture(uTexture, texCoordinates);
}