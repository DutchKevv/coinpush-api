#version 300 es
precision mediump float;

out vec4 outFragColor;

void main()
{
	vec4 tex_color;
	tex_color = vec4( 1,1,1,1 );

	outFragColor = tex_color;
}