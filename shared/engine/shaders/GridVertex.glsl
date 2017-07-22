#version 300 es

#define PI 3.141592

// size of a square in pixel
#define N 20.0

// rotation angle
#define A iGlobalTime

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	fragCoord-=iResolution.xy/2.0;

    // rotation
    vec2 Coord = mat2(cos(A),-sin(A),sin(A),cos(A))*fragCoord;

    // the grid in itself
    Coord = cos(PI/N*Coord);
	fragColor = vec4(1.0)-0.5*smoothstep(0.9,1.0,max(Coord.x,Coord.y));
}

/* // golfed version from FabriceNeyret2
void mainImage( out vec4 O, vec2 U )
{
	U = cos ( PI/N * mat2(sin(A+PI*vec4(.5,1,0,.5))) * (U-iResolution.xy/2.) );
	O += 1.-.5*smoothstep(.9,1.,max(U.x,U.y)) -O;
}
*/