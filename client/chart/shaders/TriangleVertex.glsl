layout(location = 0) in vec3 vertexPosition_modelspace;
out vec4 v_color;

void main(){
    gl_Position.xyz = vertexPosition_modelspace;
    gl_Position.w = 1.0;

    v_color = gl_Position * 0.5 + 0.5;
}
