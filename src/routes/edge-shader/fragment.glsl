#version 300 es
precision highp float;

out vec4 fragColor;
in vec2 vTextureCoord;
in vec4 vColor;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uTime;

// Edge-detection tweakable uniforms
uniform float uEdgeThreshold; // threshold for edge detection (0..1)
uniform float uEdgeThickness; // thickness/softness range (0..1)
uniform vec3 uEdgeColor; // color of the detected edges
uniform float uEdgeOpacity; // how strongly edges are applied (0..1)

// toggles — use i32 in the uniform buffer; compare to 0 in GLSL
uniform int uInvertEdges; // 0 or 1
uniform int uOnlyEdges; // 0 or 1
uniform int uUseLum; // 0 or 1

vec4 mirroredTexture(sampler2D tex, vec2 v) {
  vec2 m = mod(v, 2.);
  vec2 result = mix(m, 2. - m, step(1., m));
  return texture(tex, result);
}

vec4 clampedTexture(sampler2D sampler, vec2 coord) {
  vec2 c = clamp(coord, 0.0, 1.0);
  return texture(sampler, c);
}

float lumFromColor(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

void main(void) {
  vec2 uv = vTextureCoord.xy;
  vec2 px = 1.0 / uResolution; // pixel step

  // sample 3x3 neighborhood
  vec3 c00 = mirroredTexture(uTexture, uv + vec2(-px.x, -px.y)).rgb;
  vec3 c10 = mirroredTexture(uTexture, uv + vec2(0.0, -px.y)).rgb;
  vec3 c20 = mirroredTexture(uTexture, uv + vec2(px.x, -px.y)).rgb;
  vec3 c01 = mirroredTexture(uTexture, uv + vec2(-px.x, 0.0)).rgb;
  vec3 c11 = mirroredTexture(uTexture, uv).rgb;
  vec3 c21 = mirroredTexture(uTexture, uv + vec2(px.x, 0.0)).rgb;
  vec3 c02 = mirroredTexture(uTexture, uv + vec2(-px.x, px.y)).rgb;
  vec3 c12 = mirroredTexture(uTexture, uv + vec2(0.0, px.y)).rgb;
  vec3 c22 = mirroredTexture(uTexture, uv + vec2(px.x, px.y)).rgb;

  // choose luminance or per-channel average based on integer toggle
  float s00 = (uUseLum != 0) ? lumFromColor(c00) : (c00.r + c00.g + c00.b) * 0.3333333;
  float s10 = (uUseLum != 0) ? lumFromColor(c10) : (c10.r + c10.g + c10.b) * 0.3333333;
  float s20 = (uUseLum != 0) ? lumFromColor(c20) : (c20.r + c20.g + c20.b) * 0.3333333;
  float s01 = (uUseLum != 0) ? lumFromColor(c01) : (c01.r + c01.g + c01.b) * 0.3333333;
  float s11 = (uUseLum != 0) ? lumFromColor(c11) : (c11.r + c11.g + c11.b) * 0.3333333;
  float s21 = (uUseLum != 0) ? lumFromColor(c21) : (c21.r + c21.g + c21.b) * 0.3333333;
  float s02 = (uUseLum != 0) ? lumFromColor(c02) : (c02.r + c02.g + c02.b) * 0.3333333;
  float s12 = (uUseLum != 0) ? lumFromColor(c12) : (c12.r + c12.g + c12.b) * 0.3333333;
  float s22 = (uUseLum != 0) ? lumFromColor(c22) : (c22.r + c22.g + c22.b) * 0.3333333;

  // Sobel kernels
  float gx = -s00 - 2.0 * s01 - s02 + s20 + 2.0 * s21 + s22;
  float gy = -s00 - 2.0 * s10 - s20 + s02 + 2.0 * s12 + s22;

  float grad = length(vec2(gx, gy));
  float normalized = grad / 4.0;

  float threshold = (uEdgeThreshold > 0.0) ? uEdgeThreshold : 0.15;
  float thickness = (uEdgeThickness > 0.0) ? uEdgeThickness : 0.08;
  float edge = smoothstep(threshold, threshold + thickness, normalized);

  // invert if toggle is set
  if (uInvertEdges != 0) {
    edge = 1.0 - edge;
  }

  edge = clamp(edge * uEdgeOpacity, 0.0, 1.0);
  vec3 edgeCol = (uEdgeColor == vec3(0.0)) ? vec3(0.0) : uEdgeColor;
  vec3 base = c11;

  vec3 outColor;
  if (uOnlyEdges != 0) {
    outColor = mix(vec3(1.0), edgeCol, edge);
  } else {
    outColor = mix(base, edgeCol, edge);
  }

  fragColor = vec4(clamp(outColor, 0.0, 1.0), 1.0);
}
