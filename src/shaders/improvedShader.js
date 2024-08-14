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

void main() {
    vec2 pos = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
    vec3 totalColor = vec3(0.0);
    float totalWeight = 0.0;
    float sigma = 0.25; // Adjust this value to control the smoothness of the gradient

    for (int i = 0; i < 9; i++) {
        float dist = distance(pos, u_points[i]);
        float weight = gaussianWeight(dist, sigma);
        totalColor += u_colors[i] * weight;
        totalWeight += weight;
    }

    vec3 finalColor = totalColor / totalWeight;
    fragColor = vec4(finalColor, 1.0);
}
`;