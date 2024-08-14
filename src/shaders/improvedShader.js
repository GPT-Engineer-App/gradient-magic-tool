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

// Cubic Bézier interpolation
vec2 cubicBezier(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
    float t2 = t * t;
    float t3 = t2 * t;
    float mt = 1.0 - t;
    float mt2 = mt * mt;
    float mt3 = mt2 * mt;
    return mt3 * p0 + 3.0 * mt2 * t * p1 + 3.0 * mt * t2 * p2 + t3 * p3;
}

// Bicubic Bézier patch interpolation
vec2 bicubicBezier(vec2 p[16], vec2 t) {
    vec2 temp[4];
    for (int i = 0; i < 4; i++) {
        temp[i] = cubicBezier(p[i*4], p[i*4+1], p[i*4+2], p[i*4+3], t.x);
    }
    return cubicBezier(temp[0], temp[1], temp[2], temp[3], t.y);
}

// Cubic color interpolation
vec3 cubicColorInterpolation(vec3 c0, vec3 c1, vec3 c2, vec3 c3, float t) {
    float t2 = t * t;
    float t3 = t2 * t;
    float mt = 1.0 - t;
    float mt2 = mt * mt;
    float mt3 = mt2 * mt;
    return mt3 * c0 + 3.0 * mt2 * t * c1 + 3.0 * mt * t2 * c2 + t3 * c3;
}

// Bicubic color interpolation
vec3 bicubicColorInterpolation(vec3 c[16], vec2 t) {
    vec3 temp[4];
    for (int i = 0; i < 4; i++) {
        temp[i] = cubicColorInterpolation(c[i*4], c[i*4+1], c[i*4+2], c[i*4+3], t.x);
    }
    return cubicColorInterpolation(temp[0], temp[1], temp[2], temp[3], t.y);
}

void main() {
    vec2 pos = v_texCoord;
    vec2 p[16];
    vec3 c[16];

    // Construct the Bézier patch
    for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 4; j++) {
            int idx = i * 4 + j;
            int pointIdx = (i / 3) * u_width + (j / 3);
            
            if (i % 3 == 0 && j % 3 == 0) {
                // Corner points
                p[idx] = u_points[pointIdx];
                c[idx] = u_colors[pointIdx];
            } else {
                // Control points
                int cornerIdx = (i / 3) * u_width + (j / 3);
                vec2 cornerPoint = u_points[cornerIdx];
                int cpIdx = cornerIdx * 4;
                
                if (i % 3 == 0) {
                    // Horizontal control points
                    p[idx] = cornerPoint + u_controlPoints[cpIdx + (j % 3 == 1 ? 1 : 3)];
                } else if (j % 3 == 0) {
                    // Vertical control points
                    p[idx] = cornerPoint + u_controlPoints[cpIdx + (i % 3 == 1 ? 0 : 2)];
                } else {
                    // Interior control points (can be improved for better curve shaping)
                    vec2 h1 = cornerPoint + u_controlPoints[cpIdx + 1];
                    vec2 h2 = u_points[cornerIdx + 1] + u_controlPoints[(cornerIdx + 1) * 4 + 3];
                    vec2 v1 = cornerPoint + u_controlPoints[cpIdx + 2];
                    vec2 v2 = u_points[cornerIdx + u_width] + u_controlPoints[(cornerIdx + u_width) * 4];
                    p[idx] = mix(mix(h1, h2, 0.5), mix(v1, v2, 0.5), 0.5);
                }
                
                // Interpolate colors for control points
                c[idx] = mix(
                    mix(u_colors[cornerIdx], u_colors[cornerIdx + 1], float(j) / 3.0),
                    mix(u_colors[cornerIdx + u_width], u_colors[cornerIdx + u_width + 1], float(j) / 3.0),
                    float(i) / 3.0
                );
            }
        }
    }

    // Interpolate position and color
    vec2 finalPos = bicubicBezier(p, pos);
    vec3 finalColor = bicubicColorInterpolation(c, pos);
    
    fragColor = vec4(finalColor, 1.0);
}
`;