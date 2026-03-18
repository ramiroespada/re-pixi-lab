#version 300 es
precision highp float;

out vec4 fragColor;
in vec2 vTextureCoord;
in vec4 vColor;

uniform sampler2D uTexture;
uniform float uTime;

// PixiJS Filter Uniforms
uniform vec4 uInputSize; // xy = texture size, zw = 1/size
uniform vec4 uOutputFrame; // zw = frame size (px)

// --- Werness Dithering Core Logic ---
// This function generates the fractal-stable bit pattern
float werness_dither(vec2 pos) {
  // Scale position to pixel space
  ivec2 p = ivec2(pos);
  int x = p.x;
  int y = p.y;

  int d = 0;
  // Standard 4-level fractal loop
  for (int i = 0; i < 4; i++) {
    // The "Magic" bitwise XOR/Shift logic
    d = (d << 2) | ((x & 1) ^ ((y & 1) << 1));
    x >>= 1;
    y >>= 1;
  }
  // Return normalized 0.0 - 1.0 value
  return float(d) / 255.0;
}

void main(void) {
  // 1. Get the original color from the texture
  vec4 color = texture(uTexture, vTextureCoord);

  // 2. Convert to Grayscale (Luminance)
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // 3. Calculate Screen-Space Pixel Coordinates
  // Using vTextureCoord * uInputSize.xy ensures the pattern is 1:1 with pixels
  vec2 pixelPos = vTextureCoord * uInputSize.xy;

  // 4. Generate the Werness threshold
  float threshold = werness_dither(pixelPos);

  // 5. Apply 1-bit thresholding
  float finalBit = gray > threshold ? 1.0 : 0.0;

  // Output the 1-bit result (preserving original alpha)
  fragColor = vec4(vec3(finalBit), color.a);
}
