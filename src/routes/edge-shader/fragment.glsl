#version 300 es
precision highp float;

out vec4 fragColor;
in vec2 vTextureCoord;
in vec4 vColor;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uTime;

uniform float uEdgeThreshold;
uniform float uEdgeThickness;
uniform vec3 uEdgeColor;
uniform float uEdgeOpacity;

uniform int uInvertEdges;
uniform int uOnlyEdges;
uniform int uUseLum;

// Dark pixel isolation
uniform float uIsoThreshold; // output luminance below which a pixel counts as "dark"
uniform int uIsoRadius; // neighbor radius: 1 = 3x3, 2 = 5x5 (0 = disabled)
uniform float uIsoDarkRatio; // min fraction of dark neighbors needed to keep the pixel

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

// Shared intensity sampler used by both main() and neighborEdgeLum()
float sampleIntensity(vec2 uv) {
  vec3 c = mirroredTexture(uTexture, uv).rgb;
  return (uUseLum != 0) ? lumFromColor(c) : (c.r + c.g + c.b) * 0.3333333;
}

// Runs the full edge pipeline at 'center' and returns the output luminance.
// Used to classify whether a neighbor would be a dark (edge) pixel.
float neighborEdgeLum(vec2 center, vec2 px, vec3 eCol) {
  float t00 = sampleIntensity(center + vec2(-px.x, -px.y));
  float t10 = sampleIntensity(center + vec2(0.0, -px.y));
  float t20 = sampleIntensity(center + vec2(px.x, -px.y));
  float t01 = sampleIntensity(center + vec2(-px.x, 0.0));
  float t21 = sampleIntensity(center + vec2(px.x, 0.0));
  float t02 = sampleIntensity(center + vec2(-px.x, px.y));
  float t12 = sampleIntensity(center + vec2(0.0, px.y));
  float t22 = sampleIntensity(center + vec2(px.x, px.y));

  float ngx = -t00 - 2.0 * t01 - t02 + t20 + 2.0 * t21 + t22;
  float ngy = -t00 - 2.0 * t10 - t20 + t02 + 2.0 * t12 + t22;
  float nNorm = length(vec2(ngx, ngy)) / 4.0;

  float thresh = (uEdgeThreshold > 0.0) ? uEdgeThreshold : 0.15;
  float thick = (uEdgeThickness > 0.0) ? uEdgeThickness : 0.08;
  float nEdge = smoothstep(thresh, thresh + thick, nNorm);
  if (uInvertEdges != 0) nEdge = 1.0 - nEdge;
  nEdge = clamp(nEdge * uEdgeOpacity, 0.0, 1.0);

  vec3 nBase = mirroredTexture(uTexture, center).rgb;
  vec3 nOut = (uOnlyEdges != 0) ? mix(vec3(1.0), eCol, nEdge) : mix(nBase, eCol, nEdge);
  return lumFromColor(nOut);
}

void main(void) {
  vec2 uv = vTextureCoord.xy;
  vec2 px = 1.0 / uResolution;

  vec3 c00 = mirroredTexture(uTexture, uv + vec2(-px.x, -px.y)).rgb;
  vec3 c10 = mirroredTexture(uTexture, uv + vec2(0.0, -px.y)).rgb;
  vec3 c20 = mirroredTexture(uTexture, uv + vec2(px.x, -px.y)).rgb;
  vec3 c01 = mirroredTexture(uTexture, uv + vec2(-px.x, 0.0)).rgb;
  vec3 c11 = mirroredTexture(uTexture, uv).rgb;
  vec3 c21 = mirroredTexture(uTexture, uv + vec2(px.x, 0.0)).rgb;
  vec3 c02 = mirroredTexture(uTexture, uv + vec2(-px.x, px.y)).rgb;
  vec3 c12 = mirroredTexture(uTexture, uv + vec2(0.0, px.y)).rgb;
  vec3 c22 = mirroredTexture(uTexture, uv + vec2(px.x, px.y)).rgb;

  float s00 = (uUseLum != 0) ? lumFromColor(c00) : (c00.r + c00.g + c00.b) * 0.3333333;
  float s10 = (uUseLum != 0) ? lumFromColor(c10) : (c10.r + c10.g + c10.b) * 0.3333333;
  float s20 = (uUseLum != 0) ? lumFromColor(c20) : (c20.r + c20.g + c20.b) * 0.3333333;
  float s01 = (uUseLum != 0) ? lumFromColor(c01) : (c01.r + c01.g + c01.b) * 0.3333333;
  float s21 = (uUseLum != 0) ? lumFromColor(c21) : (c21.r + c21.g + c21.b) * 0.3333333;
  float s02 = (uUseLum != 0) ? lumFromColor(c02) : (c02.r + c02.g + c02.b) * 0.3333333;
  float s12 = (uUseLum != 0) ? lumFromColor(c12) : (c12.r + c12.g + c12.b) * 0.3333333;
  float s22 = (uUseLum != 0) ? lumFromColor(c22) : (c22.r + c22.g + c22.b) * 0.3333333;

  float gx = -s00 - 2.0 * s01 - s02 + s20 + 2.0 * s21 + s22;
  float gy = -s00 - 2.0 * s10 - s20 + s02 + 2.0 * s12 + s22;

  float normalized = length(vec2(gx, gy)) / 4.0;

  float threshold = (uEdgeThreshold > 0.0) ? uEdgeThreshold : 0.15;
  float thickness = (uEdgeThickness > 0.0) ? uEdgeThickness : 0.08;
  float edge = smoothstep(threshold, threshold + thickness, normalized);
  if (uInvertEdges != 0) edge = 1.0 - edge;
  edge = clamp(edge * uEdgeOpacity, 0.0, 1.0);

  vec3 edgeCol = (uEdgeColor == vec3(0.0)) ? vec3(0.0) : uEdgeColor;
  vec3 base = c11;

  vec3 outColor;
  if (uOnlyEdges != 0) {
    outColor = mix(vec3(1.0), edgeCol, edge);
  } else {
    outColor = mix(base, edgeCol, edge);
  }

  // Dark pixel isolation:
  // If this pixel is dark, check its neighborhood.
  // Remove it (revert to background) if fewer than uIsoDark
  //
  //   // Dark pixel isolation: if this pixel is dark, check its neighborhood.
  // Remove it (revert to background) if fewer than uIsoDarkRatio neighbors are also dark.
  if (uIsoRadius > 0 && lumFromColor(outColor) < uIsoThreshold) {
    int darkCount = 0;
    int total = 0;
    for (int dx = -uIsoRadius; dx <= uIsoRadius; dx++) {
      for (int dy = -uIsoRadius; dy <= uIsoRadius; dy++) {
        if (dx == 0 && dy == 0) continue;
        float nLum = neighborEdgeLum(uv + vec2(float(dx), float(dy)) * px, px, edgeCol);
        if (nLum < uIsoThreshold) darkCount++;
        total++;
      }
    }
    if (float(darkCount) / float(total) < uIsoDarkRatio) {
      // isolated dark pixel — revert to background
      outColor = (uOnlyEdges != 0) ? vec3(1.0) : base;
    }
  }

  vec4 color = vec4(clamp(outColor, 0.0, 1.0), 1.0);

  float strength = 0.0; // smoothstep(0.4, 0.6, uv.y);
  vec4 colorOrigin = texture(uTexture, uv);

  fragColor = mix(color, colorOrigin, strength);
}
