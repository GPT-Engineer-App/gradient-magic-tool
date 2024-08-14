export const improvedVertexShader = `#version 300 es
  in vec2 a_position;
  out vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_position * 0.5 + 0.5;
  }
`;

export const improvedFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform vec2 u_points[9];
uniform vec3 u_colors[9];
uniform vec2 u_controlPoints[36];
uniform int u_width;
uniform int u_height;

float gaussianWeight(float dist, float sigma) {
    return exp(-dist * dist / (2.0 * sigma * sigma));
}

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 pos = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
    vec3 totalColor = vec3(0.0);
    float totalWeight = 0.0;
    float sigma = 0.25; // Adjust this value to control the smoothness of the gradient
    float minDist = 1.0;
    int closestPoint = -1;

    for (int i = 0; i < 9; i++) {
        float dist = distance(pos, u_points[i]);
        if (dist < minDist) {
            minDist = dist;
            closestPoint = i;
        }
        float weight = gaussianWeight(dist, sigma);
        totalColor += u_colors[i] * weight;
        totalWeight += weight;
    }

    vec3 avgColor = totalColor / totalWeight;
    vec3 hsvAvgColor = rgb2hsv(avgColor);
    
    // Boost saturation
    hsvAvgColor.y = min(hsvAvgColor.y * 1.2, 1.0);
    
    vec3 finalColor = hsv2rgb(hsvAvgColor);

    // If we're very close to a point, use its exact color
    if (minDist < 0.01) {
        finalColor = u_colors[closestPoint];
    }

    fragColor = vec4(finalColor, 1.0);
}
`;