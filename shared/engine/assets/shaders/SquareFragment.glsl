#version 300 es
precision mediump float;

in vec4 v_color;
out vec4 colorOut;

void main(void)
{
   vec4 a = gl_Vertex;
   a.x = a.x * 0.5;
   a.y = a.y * 0.5;


   gl_Position = gl_ModelViewProjectionMatrix * a;
}