// "Path-Traced Black Hole" by Jacob Bingham (Zi7ar21)
// https://www.shadertoy.com/view/flcXW4
// Ported to WebGL2 for this site. The author's license requires keeping this
// credit header, so it must stay at the top of every GLSL file of this port.

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec4 accum = texelFetch(iChannel0, ivec2(fragCoord), 0);

    // rgb already holds the running average radiance.
    vec3 linear = accum.rgb;
    vec3 color = tonemap(linear);

    // Straight alpha so the void of space composites away instead of being an
    // opaque black box. Alpha is derived from the LINEAR radiance, not the
    // tonemapped/sRGB value: the sRGB transfer lifts faint Monte-Carlo noise to
    // ~0.15, which would otherwise paint a visible dark square over the page.
    float radiance = max(linear.r, max(linear.g, linear.b));
    // On the light theme the page is bright, so faint plasma reads as grey dust
    // instead of glow; lift the threshold so only the lit disc survives.
    float alpha = smoothstep(mix(0.08, 0.28, uLight), mix(0.45, 0.70, uLight), radiance);

    // Fade the plate out towards the canvas border so the accumulated noise
    // never ends in a visible rectangle against the page background.
    vec2 p = (fragCoord / iResolution.xy) * 2.0 - 1.0;
    alpha *= 1.0 - smoothstep(0.45, 0.98, length(p));

    fragColor = vec4(color, alpha);
}
