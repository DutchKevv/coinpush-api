precision mediump float;

uniform sampler2D mytexture;
uniform highp float sprite;

in vec4 f_color;
out vec4 outputColor;

void main(void) {
	if (sprite > 1.0)
		outputColor = texture(mytexture, gl_PointCoord) * f_color;
	else
		outputColor = f_color; //vec4(1.0, 0.0, 0.0, 1.0);
}
