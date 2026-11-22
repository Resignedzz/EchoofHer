// "Path-Traced Black Hole" by Jacob Bingham (Zi7ar21)
// https://www.shadertoy.com/view/flcXW4
// Ported to WebGL2 for this site. The author's license requires keeping this
// credit header, so it must stay at the top of every GLSL file of this port.

vec4 hash44(vec4 p4)
{
    p4  = fract( p4 * vec4(0.1031, 0.1030, 0.0973, 0.1099) );
    p4 += dot(p4, p4.wzxy + 33.33);
    return fract( (p4.xxyz + p4.yzzw) * p4.zywx);
}

float noise(vec3 p, int octave)
{
    vec3 f = fract(p);
    vec3 i = floor(p);
    vec3 s = smoothstep(0.0, 1.0, f);

    float t0 = hash44( vec4(i + vec3(0, 0, 0), octave) ).x;
    float t1 = hash44( vec4(i + vec3(1, 0, 0), octave) ).x;
    float t2 = hash44( vec4(i + vec3(0, 1, 0), octave) ).x;
    float t3 = hash44( vec4(i + vec3(1, 1, 0), octave) ).x;
    float t4 = hash44( vec4(i + vec3(0, 0, 1), octave) ).x;
    float t5 = hash44( vec4(i + vec3(1, 0, 1), octave) ).x;
    float t6 = hash44( vec4(i + vec3(0, 1, 1), octave) ).x;
    float t7 = hash44( vec4(i + vec3(1, 1, 1), octave) ).x;

    return mix(
    mix(mix(t0, t1, s.x), mix(t2, t3, s.x), s.y),
    mix(mix(t4, t5, s.x), mix(t6, t7, s.x), f.y),
    s.z);
}

float fbm(vec3 p, int iter)
{
    float value = 0.0;
    float accum = 0.0;
    float atten = 0.5;
    float scale = 1.0;

    for(int i = 0; i < iter; i++)
    {
        value += atten * noise(scale * p, iter);
        accum += atten;
        atten *= 0.5;
        scale *= 2.5;
    }

    return accum != 0.0 ? value / accum : value;
}

vec3 gravitational_field(vec3 p)
{
    vec3 r = p / blackhole_radius;
    float R = length(r);
    return -6.0 * r / (R * R * R * R * R);
}

vec3 shift_color(vec3 color, float t)
{
    color = rgb2xyz(color);
    color = xyz2rgb(color);
    return color;
}

float sample_volume(in vec3 p, out vec3 c, out vec3 e)
{
    c = vec3(0.3, 0.2, 0.1);
    e = vec3(0);

    if(dot_p(p.xz) > 8.0 || p.y * p.y > 0.3 * 0.3)
    {
        return 0.0;
    }

    // Slow Keplerian swirl: the inner plasma orbits faster than the outer edge,
    // so the turbulence shears instead of rotating as one rigid disc. The spin
    // stays slow compared to the averaging window, otherwise the accumulation
    // smears the filaments into a featureless ring.
    float spin = iTime * 0.3;
    float ang = (8.0 * p.y) + (4.0 * length(p.xz)) + spin / (0.35 + 0.6 * length(p.xz));

    float n0 = fbm(20.0 * vec3(rotate( p.xz, ang ), p.y).xzy, 8);

    float d_falloff = length(vec3(0.12, 7.50, 0.12) * p);
    float e_falloff = length(vec3(0.20, 8.00, 0.20) * p);

    float t = rand();
    e = xyz2rgb( blackbodyXYZ( (4000.0 * t * t) + 2000.0 ) );
    e = clamp(e / max(max(max(e.r, e.g), e.b), 0.01), 0.0, 1.0);

    e *= 128.0 * max(n0 - e_falloff, 0.0) / (dot_p(0.5 * p) + 0.05);

    return 128.0 * max(n0 - d_falloff, 0.0);
}

vec3 sky_radiance(vec3 dir) { return vec3(0); }

vec3 radiance(vec3 ro, vec3 rd)
{
    vec3 att = vec3(1);
    vec3 r   = vec3(0);

    vec3 p = ro + (rand() * delta_t * rd);
    vec3 v = rd;

    uint bounces = 0u;

    for(uint i = 0u; i < MAX_STEPS; i++)
    {
        if(bounces > MAX_BOUNCES) break;
        if(dot_p(p) < blackhole_radius * blackhole_radius) return r;
        if(dot_p(p) > 3.6 * 3.6) { r += att * sky_radiance( normalize(v) ); return r; }

        vec3 volume_color;
        vec3 volume_emission;

        float d = sample_volume(p, volume_color, volume_emission);

        r += att * volume_emission * delta_t;

        if(d > 0.0)
        {
            float absorbance = exp(-1.0 * delta_t * d);
            if( absorbance < rand() )
            {
                v = length(v) * reflect( normalize(v), udir3() );
                att *= volume_color;
                bounces++;
            }
        }

        vec3 g = gravitational_field(p);
        v += g * delta_t;
        p += v * delta_t;
    }

    return vec3(-1);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // rgb = running average radiance, a = how many samples that average holds.
    vec4 prev = iFrame != 0 ? texelFetch(iChannel0, ivec2(fragCoord), 0) : vec4(0.0);

    ns = uint(iFrame) * uint(iResolution.x * iResolution.y) + uint(fragCoord.x + fragCoord.y * iResolution.x);

    vec2 uv = 2.0 * (pixel_filter(fragCoord) - 0.5 * iResolution.xy) / max(iResolution.x, iResolution.y);

    #ifdef BLOOM
    float r = rand();
    if(r < 0.10) uv = nrand2(uv, rand() * 0.015);
    if(r > 0.90) uv = nrand2(uv, rand() * 0.200);
    #endif

    mat3 rotmat = mat3(
     0.8, -0.2, -0.0,
     0.2,  0.8, -0.0,
    -0.0, -0.0,  1.0);
    rotmat[0] = normalize(rotmat[0]);
    rotmat[1] = normalize(rotmat[1]);
    rotmat[2] = normalize(rotmat[2]);

    vec3 ro = vec3(0.0, 0.2, 3.5);
    vec3 rd = normalize(vec3(CAMERA_FOV * uv, -1.0) * rotmat);

    vec3 color = radiance(ro, rd);
    if(any(lessThan(color, vec3(0))) || any(isinf(color)) || any(isnan(color))) color = vec3(0);

    // Warm-up averages every sample; afterwards the window stays short enough
    // that the swirling plasma follows the motion while noise stays low.
    float n = prev.a;
    float k = n < 100.0 ? 1.0 / (n + 1.0) : 0.07;
    fragColor = vec4(mix(prev.rgb, color, k), min(n + 1.0, 100.0));
}
