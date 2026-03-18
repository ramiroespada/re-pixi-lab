#version 300 es
precision highp float;

out vec4 fragColor;
in vec2 vTextureCoord;
in vec4 vColor;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uTime;
uniform float uAmountOfLines;
uniform vec4 uLinesColor;
uniform int uPattern; // 0 = quad, 1= top-left, 2= top-right
uniform int uInvert;
uniform float uQuadOriginX;
uniform float uQuadOriginY;

// Built-in PixiJS filter uniforms
uniform vec4 uInputSize; // xy = input texture size,  zw = 1/size
uniform vec4 uOutputFrame; // xy = frame offset (px),   zw = frame size (px)
uniform vec4 uOutputTexture; // xy = output texture size, zw = unused here

vec4 pixelate(float size, vec2 uv) {
  float dx = size / uResolution.x;
  float dy = size / uResolution.y;

  float p_x = floor(uv.x / dx);
  float p_y = floor(uv.y / dy);

  vec2 p_uv = vec2(dx * p_x, dy * p_y);

  return texture(uTexture, p_uv);
}

void main(void) {
  vec2 uv = vTextureCoord;

  // Sample the texture and compute darkness (1.0 = black, 0.0 = white)
  vec4 texColor = texture(uTexture, uv);
  float brightness = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
  float darkness = 1.0 - brightness;

  // ── True screen-normalised position ─────────────────────────────────────────
  // vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw), so it is
  // NOT a plain [0,1] UV. Reconstruct the actual [0,1] screen position using
  // the built-in PixiJS frame uniforms — works correctly on every DPR/screen.
  vec2 screenNorm = (uOutputFrame.xy + uv * uInputSize.xy) / uOutputTexture.xy;

  // ── Quadrant detection ───────────────────────────────────────────────────────
  // quadrant: (0,0)=top-left  (1,0)=top-right
  //           (0,1)=bot-left  (1,1)=bot-right
  vec2 quadrant = vec2(step(uQuadOriginX, screenNorm.x), step(uQuadOriginY, screenNorm.y));

  if (uPattern == 1)
    quadrant = vec2(0, 0);

  if (uPattern == 2)
    quadrant = vec2(1, 0);

  // Local position inside the quadrant, normalised to [0, 1]
  vec2 luv = fract(screenNorm * 2.0);

  // "/" quadrants: top-left (0,0) and bot-right (1,1) → quadrant.x == quadrant.y
  // "\" quadrants: top-right(1,0) and bot-left (0,1) → quadrant.x != quadrant.y
  float useSlash = 1.0 - abs(quadrant.x - quadrant.y);

  // ── Diagonal parameter ───────────────────────────────────────────────────────
  // "/"  luv.x + luv.y        ∈ [0, 2]  — left→top  / bot→right
  // "\"  luv.y - luv.x + 1.0  ∈ [0, 2]  — left→bot  / top→right
  float slashT = luv.x + luv.y;
  float backslashT = luv.y - luv.x + 1.0;
  float t = mix(backslashT, slashT, useSlash) * uAmountOfLines;

  float band = fract(t);

  // Distance from the nearest line (0 = on the line, 0.5 = band centre)
  float d = min(band, 1.0 - band);

  // Line half-width: dark pixel → thick (0.5 = full band), light → zero
  float halfWidth = darkness * 0.5;

  // Anti-aliased edge using screen-space derivative
  float fw = fwidth(t) * 0.5;
  float lineMask = 1.0 - smoothstep(halfWidth - fw, halfWidth + fw, d);

  fragColor = uLinesColor * lineMask;

  if (uInvert != 0) {
    fragColor = vec4(1.0 - fragColor.rgb, fragColor.a);
  }
}
