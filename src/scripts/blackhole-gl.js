// WebGL2 port of "Path-Traced Black Hole" by Jacob Bingham (Zi7ar21)
// Original: https://www.shadertoy.com/view/flcXW4 — keep this credit.
//
// Two-program progressive path tracer:
//   Buffer A  : reads the previous accumulation texture, folds in one sample
//   Image pass: tonemaps the running average and composites
// Textures ping-pong at the canvas backing-store resolution.

import commonSrc from '../shaders/common.glsl?raw';
import bufferASrc from '../shaders/buffer-a.glsl?raw';
import imageSrc from '../shaders/image.glsl?raw';

// The accumulation is a running average, so the plasma keeps swirling for as
// long as the canvas is on screen. Cap the rate to keep the path tracer cheap.
const FRAME_INTERVAL = 1000 / 30;
// Without motion we still want a converged still frame, just no animation.
const STATIC_SAMPLES = 160;
const MAX_EDGE = 360;

const VERT_SRC = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG_PRELUDE = `#version 300 es
precision highp float;
precision highp int;
uniform vec3 iResolution;
uniform float iTime;
uniform int iFrame;
uniform sampler2D iChannel0;
uniform float uLight;
out vec4 outColor;
`;

const FRAG_EPILOGUE = `
void main() { vec4 c; mainImage(c, gl_FragCoord.xy); outColor = c; }
`;

const bufferAFrag = FRAG_PRELUDE + commonSrc + '\n' + bufferASrc + FRAG_EPILOGUE;
const imageFrag = FRAG_PRELUDE + commonSrc + '\n' + imageSrc + FRAG_EPILOGUE;

const canvas = document.getElementById('hero-globe');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4;

if (canvas && !lowMemory) {
  try {
    start(canvas);
  } catch (err) {
    console.warn('[blackhole] init failed, leaving hero canvas empty:', err);
  }
}

function start(canvas) {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  });

  if (!gl || typeof gl.createShader !== 'function') {
    console.warn('[blackhole] WebGL2 is unavailable; hero canvas stays empty.');
    return;
  }

  // Rendering to float textures needs an extension in WebGL2.
  let internalFormat;
  let texType;
  if (gl.getExtension('EXT_color_buffer_float')) {
    internalFormat = gl.RGBA32F;
    texType = gl.FLOAT;
  } else if (gl.getExtension('EXT_color_buffer_half_float')) {
    internalFormat = gl.RGBA16F;
    texType = gl.HALF_FLOAT;
  } else {
    console.warn('[blackhole] No float render targets available; hero canvas stays empty.');
    return;
  }

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
  if (!vertexShader) return;

  const bufferProgram = createProgram(gl, vertexShader, bufferAFrag, 'Buffer A');
  const imageProgram = createProgram(gl, vertexShader, imageFrag, 'Image');
  if (!bufferProgram || !imageProgram) return;

  // Attribute-less full-screen triangle.
  gl.bindVertexArray(gl.createVertexArray());

  // Ping-pong state: `current` is the texture holding the latest accumulation.
  let targets = null;
  let width = 0;
  let height = 0;
  let current = 0;
  let frame = 0;
  let visible = true;
  let rafId = 0;
  let lastDrawAt = -Infinity;
  const startTime = performance.now();
  const frameCap = reducedMotion ? STATIC_SAMPLES : Infinity;
  const frameInterval = reducedMotion ? 0 : FRAME_INTERVAL;
  let lightMode = document.documentElement.classList.contains('light') ? 1 : 0;

  bindSampler(gl, bufferProgram);
  bindSampler(gl, imageProgram);

  function createTarget(w, h) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, gl.RGBA, texType, null);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return complete ? { texture, fbo } : null;
  }

  function releaseTargets() {
    if (!targets) return;
    for (const target of targets) {
      gl.deleteFramebuffer(target.fbo);
      gl.deleteTexture(target.texture);
    }
    targets = null;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.round(rect.width) || 340;
    const cssH = Math.round(rect.height) || 340;
    const scale = Math.min(window.devicePixelRatio || 1, 1);
    const w = Math.max(1, Math.min(Math.round(cssW * scale), MAX_EDGE));
    const h = Math.max(1, Math.min(Math.round(cssH * scale), MAX_EDGE));
    if (targets && w === width && h === height) return false;

    width = w;
    height = h;
    canvas.width = w;
    canvas.height = h;

    releaseTargets();
    const a = createTarget(w, h);
    const b = createTarget(w, h);
    if (!a || !b) {
      if (a) { gl.deleteFramebuffer(a.fbo); gl.deleteTexture(a.texture); }
      if (b) { gl.deleteFramebuffer(b.fbo); gl.deleteTexture(b.texture); }
      console.warn('[blackhole] Could not allocate float render targets; hero canvas stays empty.');
      return false;
    }
    targets = [a, b];
    current = 0;
    frame = 0;
    return true;
  }

  function drawFrame() {
    // Freezing the clock under prefers-reduced-motion yields a still image.
    const time = reducedMotion ? 0 : (performance.now() - startTime) / 1000;
    const src = targets[current];
    const dst = targets[current ^ 1];

    // Buffer A: previous accumulation -> new accumulation.
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
    gl.viewport(0, 0, width, height);
    gl.useProgram(bufferProgram.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src.texture);
    gl.uniform3f(bufferProgram.resolution, width, height, 1);
    gl.uniform1f(bufferProgram.time, time);
    gl.uniform1i(bufferProgram.frame, frame);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    current ^= 1;

    // Image pass: latest accumulation -> default framebuffer.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.useProgram(imageProgram.program);
    gl.bindTexture(gl.TEXTURE_2D, targets[current].texture);
    gl.uniform3f(imageProgram.resolution, width, height, 1);
    gl.uniform1f(imageProgram.time, time);
    gl.uniform1i(imageProgram.frame, frame);
    gl.uniform1f(imageProgram.light, lightMode);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    frame += 1;
  }

  function tick(now) {
    rafId = 0;
    if (!visible || !targets || frame >= frameCap) return;
    if (now - lastDrawAt >= frameInterval - 0.5) {
      lastDrawAt = now;
      drawFrame();
    }
    if (visible && frame < frameCap) rafId = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (rafId || !visible || !targets || frame >= frameCap) return;
    rafId = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function onVisibilityChange() {
    if (visible) startLoop();
    else stopLoop();
  }

  // Static content: when the tab is hidden we cannot see progress anyway.
  resize();
  if (!targets) return;

  if (typeof IntersectionObserver === 'function') {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      visible = entry.isIntersecting;
      onVisibilityChange();
    }, { threshold: 0 });
    observer.observe(canvas);
  }

  if (typeof ResizeObserver === 'function') {
    const resizeObserver = new ResizeObserver(() => {
      if (resize()) startLoop();
    });
    resizeObserver.observe(canvas);
  } else {
    window.addEventListener('resize', () => {
      if (resize()) startLoop();
    });
  }

  // A hidden tab cannot show progress, and the loop now runs indefinitely.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopLoop();
    else startLoop();
  });

  // The light theme needs a stricter alpha threshold (see image.glsl).
  if (typeof MutationObserver === 'function') {
    new MutationObserver(() => {
      lightMode = document.documentElement.classList.contains('light') ? 1 : 0;
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  startLoop();
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    console.warn('[blackhole] shader compile failed:\n' + log);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertexShader, fragmentSource, label) {
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!fragmentShader) return null;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('[blackhole] ' + label + ' program link failed:\n' + gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return {
    program,
    resolution: gl.getUniformLocation(program, 'iResolution'),
    time: gl.getUniformLocation(program, 'iTime'),
    frame: gl.getUniformLocation(program, 'iFrame'),
    channel0: gl.getUniformLocation(program, 'iChannel0'),
    light: gl.getUniformLocation(program, 'uLight'),
  };
}

function bindSampler(gl, pass) {
  gl.useProgram(pass.program);
  gl.uniform1i(pass.channel0, 0);
}
