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

    // Find the four closest points to the current position
    int closestIndices[4];
    float closestDistances[4];
    for (int i = 0; i < 4; i++) {
        closestIndices[i] = -1;
        closestDistances[i] = 1000000.0;
    }

    for (int i = 0; i < 9; i++) {
        float dist = distance(pos, u_points[i]);
        for (int j = 0; j < 4; j++) {
            if (dist < closestDistances[j]) {
                for (int k = 3; k > j; k--) {
                    closestIndices[k] = closestIndices[k-1];
                    closestDistances[k] = closestDistances[k-1];
                }
                closestIndices[j] = i;
                closestDistances[j] = dist;
                break;
            }
        }
    }

    // Construct the Bézier patch using the four closest points
    for (int i = 0; i < 4; i++) {
        int idx = closestIndices[i];
        p[i*4] = u_points[idx];
        c[i*4] = u_colors[idx];

        // Control points
        p[i*4 + 1] = p[i*4] + u_controlPoints[idx * 4 + 1];
        p[i*4 + 2] = p[i*4] + u_controlPoints[idx * 4 + 2];
        p[i*4 + 3] = p[i*4] + u_controlPoints[idx * 4 + 3];

        // Interpolate colors for control points
        c[i*4 + 1] = mix(c[i*4], c[(i*4+4) % 16], 0.33333);
        c[i*4 + 2] = mix(c[i*4], c[(i*4+4) % 16], 0.66667);
        c[i*4 + 3] = c[(i*4+4) % 16];
    }

    // Calculate local coordinates within the patch
    vec2 localCoord;
    localCoord.x = distance(pos, p[0]) / (distance(p[0], p[12]) + 0.0001);
    localCoord.y = distance(pos, p[0]) / (distance(p[0], p[3]) + 0.0001);
    localCoord = clamp(localCoord, 0.0, 1.0);

    // Interpolate position and color
    vec2 finalPos = bicubicBezier(p, localCoord);
    vec3 finalColor = bicubicColorInterpolation(c, localCoord);
    
    fragColor = vec4(finalColor, 1.0);
}
`;