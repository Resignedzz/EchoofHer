// "Path-Traced Black Hole" by Jacob Bingham (Zi7ar21)
// https://www.shadertoy.com/view/flcXW4
// Ported to WebGL2 for this site. The author's license requires keeping this
// credit header, so it must stay at the top of every GLSL file of this port.

// ##### Preprocessor #####
// ##### Parameters #####
#define CAMERA_FOV 1.0
#define EXPOSURE 1.0
#define sRGB_transfer
#define BLOOM
#define blackhole_radius 0.6
#define delta_t 0.05
#define MAX_BOUNCES 4u
#define MAX_DIST 4.0
#define MAX_STEPS 16384u

const float pi     = 3.141592653589793;
const float two_pi = 6.283185307179586;
const float inv_pi = 0.318309886183790;

vec2 rotate(vec2 vector, float theta)
{
    float s = sin(theta), c = cos(theta);
    return vec2(vector.x * c - vector.y * s, vector.x * s + vector.y * c);
}

float dot_p(vec2 vector) { return dot(vector, vector); }
float dot_p(vec3 vector) { return dot(vector, vector); }
float dot_p(vec4 vector) { return dot(vector, vector); }

vec3 tonemap(vec3 color)
{
    color = smoothstep( 0.0, 1.0, 1.0 - exp(-color * EXPOSURE) );
    #ifdef sRGB_transfer
    color  = vec3(
    color.r > 0.0031308 ? (pow(color.r, 1.0 / 2.4) * 1.055) - 0.055 : color.r * 12.92,
    color.g > 0.0031308 ? (pow(color.g, 1.0 / 2.4) * 1.055) - 0.055 : color.g * 12.92,
    color.b > 0.0031308 ? (pow(color.b, 1.0 / 2.4) * 1.055) - 0.055 : color.b * 12.92);
    #endif
    return clamp(color, 0.0, 1.0);
}

const mat3 XYZ2sRGB = mat3(
 3.240, -1.537, -0.499,
-0.969,  1.876,  0.042,
 0.056, -0.204,  1.057);

vec3 xyz2rgb(vec3 color_xyz) { return color_xyz * XYZ2sRGB; }
vec3 rgb2xyz(vec3 color_rgb) { return color_rgb * transpose(XYZ2sRGB); }

vec3 blackbodyXYZ(float t)
{
    float u = (0.860117757 + 1.54118254E-4 * t + 1.28641212E-7 * t * t) / (1.0 + 8.42420235E-4 * t + 7.08145163E-7 * t * t);
    float v = (0.317398726 + 4.22806245E-5 * t + 4.20481691E-8 * t * t) / (1.0 - 2.89741816E-5 * t + 1.61456053E-7 * t * t);
    vec2 xyy = vec2(3.0 * u, 2.0 * v) / (2.0 * u - 8.0 * v + 4.0);
    return vec3(xyy.x / xyy.y, 1.0, (1.0 - xyy.x - xyy.y) / xyy.y);
}

uint triple32(uint x)
{
    x ^= x >> 17u;
    x *= 0xED5AD4BBu;
    x ^= x >> 11u;
    x *= 0xAC4C1B51u;
    x ^= x >> 15u;
    x *= 0x31848BABu;
    x ^= x >> 14u;
    return x;
}

uint ns;

float rand()
{
    ns = triple32(ns);
    return float(ns) / float(0xFFFFFFFFu);
}

vec2 rand2() { vec2 v; v.x = rand(); v.y = rand(); return v; }
vec3 rand3() { vec3 v; v.x = rand(); v.y = rand(); v.z = rand(); return v; }
vec4 rand4() { vec4 v; v.x = rand(); v.y = rand(); v.z = rand(); v.w = rand(); return v; }

vec2 udir2()
{
    float z = rand();
    float r = two_pi * z;
    float s = sin(r), c = cos(r);
    return vec2(s, c);
}

vec3 udir3()
{
    vec2 z = rand2();
    vec2 r = vec2( two_pi * z.x, acos(2.0 * z.y - 1.0) );
    vec2 s = sin(r), c = cos(r);
    return vec3(c.x * s.y, s.x * s.y, c.y);
}

vec2 nrand2(vec2 mean, float sigma)
{
    vec2 z = rand2();
    return mean + sigma * sqrt( -2.0 * log(z.x   ) ) * vec2(cos(two_pi * z.y), sin(two_pi * z.y) );
}

vec2 pixel_filter(vec2 pixel_coord)
{
    float r = pow(2.0 * acos(1.0 - rand()) / pi, 0.78539821704);
    return pixel_coord + rand() * udir2();
}
