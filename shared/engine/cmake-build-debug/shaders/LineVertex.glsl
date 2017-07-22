#version 300 es

uniform mat4 uProjectionMatrix;
uniform mat4 uModelviewMatrix;

in vec3 inCoord;

void main()
{
	gl_Position = uProjectionMatrix * uModelviewMatrix * vec4(inCoord, 1);
}