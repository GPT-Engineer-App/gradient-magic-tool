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

float voronoiWeight(float dist, float sharpness) {
    return 1.0 / pow(dist, sharpness);
}

void main() {
    vec2 pos = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
    vec3 totalColor = vec3(0.0);
    float totalWeight = 0.0;
    float sharpness = 8.0; // Adjust this value to control the sharpness of color transitions

    float closestDist = 1000.0;
    vec3 closestColor = vec3(0.0);

    for (int i = 0; i < 9; i++) {
        float dist = distance(pos, u_points[i]);
        if (dist < closestDist) {
            closestDist = dist;
            closestColor = u_colors[i];
        }
        float weight = voronoiWeight(dist, sharpness);
        totalColor += u_colors[i] * weight;
        totalWeight += weight;
    }

    vec3 voronoiColor = totalColor / totalWeight;
    
    // Blend between Voronoi and closest color based on distance
    float blendFactor = smoothstep(0.0, 0.1, closestDist);
    vec3 finalColor = mix(closestColor, voronoiColor, blendFactor);

    fragColor = vec4(finalColor, 1.0);
}
`;