in vec2 texpos;
uniform sampler2D tex;
uniform vec4 color;

out vec4 outColor;

void main(void) {
  outColor = vec4(1, 1, 1, texture(tex, texpos).a) * color;
}
