#version 300 es
precision highp float;

out vec4 fragColor;
in vec2 vTextureCoord;
in vec4 vColor;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uTime;
uniform float contour;

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

void main(void) {
  vec2 uv = vTextureCoord.xy;
  fragColor = mirroredTexture(uTexture, uv);
}
