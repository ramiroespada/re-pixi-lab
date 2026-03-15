#version 300 es
precision highp float;

out vec4 fragColor;
in vec2 vTextureCoord;
in vec4 vColor;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uTime;
uniform float uContour;
uniform int uInvert;

// Built-in PixiJS filter uniforms
uniform vec4 uInputSize; // xy = input texture size,  zw = 1/size
uniform vec4 uOutputFrame; // xy = frame offset (px),   zw = frame size (px)
uniform vec4 uOutputTexture; // xy = output texture size, zw = unused here

vec4 mirroredTexture(sampler2D tex, vec2 v) {
  vec2 m = mod(v, 2.);
  vec2 result = mix(m, 2. - m, step(1., m));
  return texture(tex, result);
}

vec4 clampedTexture(sampler2D sampler, vec2 coord) {
  vec2 c = clamp(coord, 0.0, 1.0);
  return texture(sampler, c);
}

// 2D Noise based on Morgan McGuire @morgan3d
float random(in vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(in vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1., 0.));
  float c = random(i + vec2(0., 1.));
  float d = random(i + vec2(1., 1.));
  vec2 u = f * f * (3. - 2. * f);
  return mix(a, b, u.x) +
    (c - a) * u.y * (1. - u.x) +
    (d - b) * u.x * u.y;
}
//

vec4 sobel(sampler2D src, vec2 vUV, vec2 resolution, float contour) {
  float x = contour / resolution.x;
  float y = contour / resolution.y;
  vec4 horizEdge = vec4(0.);
  float n = noise(vec2(x, y));
  vec2 uv = vUV;

  horizEdge -= clampedTexture(src, vec2(uv.x - x, uv.y - y)) * 1.;
  horizEdge -= clampedTexture(src, vec2(uv.x - x, uv.y)) * 2.;
  horizEdge -= clampedTexture(src, vec2(uv.x - x, uv.y + y)) * 1.;
  horizEdge += clampedTexture(src, vec2(uv.x + x, uv.y - y)) * 1.;
  horizEdge += clampedTexture(src, vec2(uv.x + x, uv.y)) * 2.;
  horizEdge += clampedTexture(src, vec2(uv.x + x, uv.y + y)) * 1.;

  vec4 vertEdge = vec4(0.);
  vertEdge -= clampedTexture(src, vec2(uv.x - x, uv.y - y)) * 1.;
  vertEdge -= clampedTexture(src, vec2(uv.x, uv.y - y)) * 2.;
  vertEdge -= clampedTexture(src, vec2(uv.x + x, uv.y - y)) * 1.;
  vertEdge += clampedTexture(src, vec2(uv.x - x, uv.y + y)) * 1.;
  vertEdge += clampedTexture(src, vec2(uv.x, uv.y + y)) * 2.;
  vertEdge += clampedTexture(src, vec2(uv.x + x, uv.y + y)) * 1.;
  vec4 edge = sqrt((horizEdge * horizEdge) + (vertEdge * vertEdge));
  return edge;
}

void main(void) {
  vec2 uv = vTextureCoord.xy;

  vec2 screenNorm = (uOutputFrame.xy + uv * uInputSize.xy) / uOutputTexture.xy;

  fragColor = mirroredTexture(uTexture, uv);

  vec2 size = (uResolution.x > 0.0 && uResolution.y > 0.0)
    ? uResolution : vec2(textureSize(uTexture, 0));

  fragColor = sobel(uTexture, uv, size, uContour);

  if (uInvert != 0) {
    fragColor = vec4(1.0 - fragColor.rgb, fragColor.a);
  }
}
