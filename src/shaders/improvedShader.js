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

// Find the cell containing the current pixel
ivec2 findCell(vec2 pos) {
    for (int i = 0; i < u_width - 1; i++) {
        for (int j = 0; j < u_height - 1; j++) {
            int idx = j * u_width + i;
            vec2 p00 = u_points[idx];
            vec2 p10 = u_points[idx + 1];
            vec2 p01 = u_points[idx + u_width];
            vec2 p11 = u_points[idx + u_width + 1];
            
            // Check if pos is inside this cell (approximate)
            if (pos.x >= min(p00.x, min(p10.x, min(p01.x, p11.x))) &&
                pos.x <= max(p00.x, max(p10.x, max(p01.x, p11.x))) &&
                pos.y >= min(p00.y, min(p10.y, min(p01.y, p11.y))) &&
                pos.y <= max(p00.y, max(p10.y, max(p01.y, p11.y)))) {
                return ivec2(i, j);
            }
        }
    }
    return ivec2(0, 0); // Fallback
}

void main() {
    vec2 pos = v_texCoord;
    ivec2 cell = findCell(pos);
    int idx = cell.y * u_width + cell.x;
    
    // Gather corner points and control points
    vec2 p[16];
    p[0] = u_points[idx];
    p[3] = u_points[idx + 1];
    p[12] = u_points[idx + u_width];
    p[15] = u_points[idx + u_width + 1];
    
    // Control points
    p[1] = p[0] + u_controlPoints[idx * 4 + 1];
    p[2] = p[3] + u_controlPoints[(idx + 1) * 4 + 3];
    p[4] = p[0] + u_controlPoints[idx * 4 + 2];
    p[7] = p[3] + u_controlPoints[(idx + 1) * 4 + 2];
    p[8] = p[12] + u_controlPoints[(idx + u_width) * 4];
    p[11] = p[15] + u_controlPoints[(idx + u_width + 1) * 4 + 3];
    p[13] = p[12] + u_controlPoints[(idx + u_width) * 4 + 1];
    p[14] = p[15] + u_controlPoints[(idx + u_width + 1) * 4];
    
    // Interior control points (can be improved for better curve shaping)
    p[5] = mix(p[4], p[7], 0.33333);
    p[6] = mix(p[4], p[7], 0.66667);
    p[9] = mix(p[8], p[11], 0.33333);
    p[10] = mix(p[8], p[11], 0.66667);
    
    // Find local coordinates within the cell
    vec2 cellSize = vec2(1.0 / float(u_width - 1), 1.0 / float(u_height - 1));
    vec2 localPos = (pos - vec2(float(cell.x) * cellSize.x, float(cell.y) * cellSize.y)) / cellSize;
    
    // Interpolate position
    vec2 finalPos = bicubicBezier(p, localPos);
    
    // Interpolate color (using bilinear interpolation for simplicity, can be extended to bicubic)
    vec3 c00 = u_colors[idx];
    vec3 c10 = u_colors[idx + 1];
    vec3 c01 = u_colors[idx + u_width];
    vec3 c11 = u_colors[idx + u_width + 1];
    vec3 finalColor = mix(
        mix(c00, c10, localPos.x),
        mix(c01, c11, localPos.x),
        localPos.y
    );
    
    fragColor = vec4(finalColor, 1.0);
}
`;