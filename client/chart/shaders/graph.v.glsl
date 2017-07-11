layout(location = 0) in vec2 coord2d;
out vec4 f_color;

uniform lowp float offset_x;
uniform lowp float scale_x;
uniform highp float sprite;
uniform highp float point_size;

void main(void) {
	gl_Position = vec4((coord2d.x + offset_x) * scale_x, coord2d.y, 0, 1);
	f_color = vec4(coord2d.xy / 2.0 + 0.5, 1, 1);
	// gl_PointSize = max(1.0, sprite);
	gl_PointSize = point_size;
}
