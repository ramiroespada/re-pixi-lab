#version 300 es
precision highp float;

in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uContour; // Brightness multiplier (default: 1.0)
uniform float uSpacing; // Distance between lines (default: 8.0)
uniform float uHatchLimit; // Brightness where hatching stops (default: 0.5)
uniform float uSmoothness; // Ink sharpness vs bleed (default: 0.05)

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main(void) {
  vec4 tex = texture(uTexture, vTextureCoord);
  float luma = dot(tex.rgb, vec3(0.2126, 0.7152, 0.0722));
  float val = clamp(luma * uContour, 0.0, 1.0);

  // Dynamic thickness: 0.8 in darks, 0.1 in lights
  float thickness = clamp(0.8 - (val * 0.7), 0.1, 0.9);

  // Smoothstep creates an "anti-aliased" or "ink-bleed" look
  float coord1 = mod(gl_FragCoord.x + gl_FragCoord.y, uSpacing) / uSpacing;
  float coord2 = mod(gl_FragCoord.x - gl_FragCoord.y, uSpacing) / uSpacing;

  float line1 = smoothstep(thickness - uSmoothness, thickness + uSmoothness, coord1);
  float line2 = smoothstep(thickness - uSmoothness, thickness + uSmoothness, coord2);

  float stipple = step(random(gl_FragCoord.xy), val);

  float pattern = 1.0;
  if (val < uHatchLimit * 0.5) {
    pattern = min(line1, line2); // Cross-hatch
  } else if (val < uHatchLimit) {
    pattern = line1; // Single hatch
  }

  finalColor = vec4(vec3(pattern), tex.a);
}
