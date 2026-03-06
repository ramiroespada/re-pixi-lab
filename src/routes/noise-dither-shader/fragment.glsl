#version 300 es
precision highp float;

out vec4 fragColor;
in vec2 vTextureCoord;
in vec4 vColor;

uniform sampler2D uTexture;
uniform sampler2D uBlueNoise;
uniform vec2 uResolution;
uniform float uTime;
uniform float uBlueNoiseSize;

vec4 mirroredTexture(sampler2D tex, vec2 v) {
  vec2 m = mod(v, 2.);
  vec2 result = mix(m, 2. - m, step(1., m));
  return texture(tex, result);
}

vec4 clampedTexture(sampler2D sampler, vec2 coord) {
  vec2 c = clamp(coord, 0.0, 1.0);
  return texture(sampler, c);
}

float GetBlueNoiseDither(float grayscale, ivec2 pixelCoord) {
  vec2 uv = (vec2(pixelCoord) + 0.5) / uBlueNoiseSize;
  float blueNoiseValue = texture(uBlueNoise, fract(uv)).x; // removed redundant 0.0 bias
  return blueNoiseValue < grayscale ? 1.0 : 0.0;
}

float GetPixelColor(vec2 uv) {
  vec4 texColor = texture(uTexture, uv);

  float grayscale = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));

  // scale UV → actual pixel coords for the blue noise lookup
  ivec2 pixelCoord = ivec2(uv * uResolution);

  // pass grayscale float (not texColor vec4), use correct pixel coords
  float ditherColor = GetBlueNoiseDither(grayscale, pixelCoord);

  return ditherColor; // was returning grayscale, discarding the dither result
}

void main(void) {
  vec2 uv = vTextureCoord.xy;

  float linearColor = 0.0;
  linearColor = GetPixelColor(uv);
  fragColor = vec4(pow(vec3(linearColor), vec3(1.0 / 2.2)), 1.0);
}
