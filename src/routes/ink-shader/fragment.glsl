#version 300 es
precision highp float;

in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform sampler2D uBlueNoise; // tiling blue noise texture (R=x jitter, G=y jitter)
uniform float uContour;
uniform float uSpacing;
uniform float uHatchLimit;
uniform float uSmoothness;
uniform float uRenderMode;
uniform float uJitter;
uniform float uBlueNoiseSize; // texture width/height in texels (e.g. 64.0)

void main(void) {
  vec4 tex = texture(uTexture, vTextureCoord);
  float luma = dot(tex.rgb, vec3(0.2126, 0.7152, 0.0722));
  float val = clamp(luma, 0.0, 1.0);

  float thickness = clamp((1.0 - val) * uContour * 0.8, 0.0, 0.8);

  // ── Line pattern ─────────────────────────────────────────────────────────
  float coord1 = mod(gl_FragCoord.x + gl_FragCoord.y, uSpacing) / uSpacing;
  float coord2 = mod(gl_FragCoord.x - gl_FragCoord.y, uSpacing) / uSpacing;

  float lineEdgeLow = max(0.0, thickness - uSmoothness);
  float line1 = smoothstep(lineEdgeLow, thickness + uSmoothness, coord1);
  float line2 = smoothstep(lineEdgeLow, thickness + uSmoothness, coord2);

  float linePattern = 1.0;
  if (val < uHatchLimit * 0.5) {
    linePattern = min(line1, line2);
  } else if (val < uHatchLimit) {
    linePattern = line1;
  }

  // ── Dot pattern: blue noise jitter + 3×3 neighbourhood ───────────────────
  // Each cell index is used as a texel coordinate into the blue noise texture.
  // Because addressMode = 'repeat', it tiles automatically across the screen.
  // R channel → X displacement,  G channel → Y displacement.
  // Both channels are independent blue-noise sequences, so the 2D jitter
  // has no low-frequency clustering that the hash approach can produce.
  vec2 cellIndex = floor(gl_FragCoord.xy / uSpacing);

  float dotRadius_px = thickness * 0.5 * uSpacing;
  float smoothEdge_px = uSmoothness * uSpacing;
  float minDist = 1.0e10;

  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      vec2 nIdx = cellIndex + vec2(float(dx), float(dy));
      vec2 noiseUV = (nIdx + 0.5) / uBlueNoiseSize;

      // Sample the same texture at two offset positions to get independent
      // X and Y values. Without the offset, a greyscale texture returns the
      // same value for both channels → diagonal-only jitter.
      float bnX = texture(uBlueNoise, noiseUV).r;
      float bnY = texture(uBlueNoise, noiseUV + vec2(0.5)).r; // half-texture shift

      vec2 jitter = (vec2(bnX, bnY) - 0.5) * uJitter * 0.45;
      vec2 center_px = (nIdx + vec2(0.5) + jitter) * uSpacing;
      minDist = min(minDist, distance(gl_FragCoord.xy, center_px));
    }
  }

  float dotEdgeLow = max(0.0, dotRadius_px - smoothEdge_px);
  float dotPattern = 1.0;
  if (val < uHatchLimit) {
    dotPattern = smoothstep(dotEdgeLow, dotRadius_px + smoothEdge_px, minDist);
  }

  // ── Select mode ───────────────────────────────────────────────────────────
  float pattern = mix(linePattern, dotPattern, step(0.5, uRenderMode));

  finalColor = vec4(vec3(pattern), tex.a);
}
