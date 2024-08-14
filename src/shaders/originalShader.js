export const originalVertexShader = `#version 300 es
  in vec2 a_position;
  out vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_position * 0.5 + 0.5;
  }
`;

export const originalFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform vec2 u_points[9];
uniform vec3 u_colors[9];
uniform vec2 u_controlPoints[36];
uniform int u_width;
uniform int u_height;

// Cubic Bezier interpolation
vec2 cubicBezier(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
    float t2 = t * t;
    float t3 = t2 * t;
    float mt = 1.0 - t;
    float mt2 = mt * mt;
    float mt3 = mt2 * mt;
    return mt3 * p0 + 3.0 * mt2 * t * p1 + 3.0 * mt * t2 * p2 + t3 * p3;
}

// Bicubic Bezier patch interpolation
vec2 bicubicBezier(vec2 p[16], vec2 t) {
    vec2 temp[4];
    for (int i = 0; i < 4; i++) {
        temp[i] = cubicBezier(p[i*4], p[i*4+1], p[i*4+2], p[i*4+3], t.x);
    }
    return cubicBezier(temp[0], temp[1], temp[2], temp[3], t.y);
}

// Color interpolation
vec3 colorInterpolation(vec3 c0, vec3 c1, vec3 c2, vec3 c3, vec2 t) {
    vec3 c01 = mix(c0, c1, t.x);
    vec3 c23 = mix(c2, c3, t.x);
    return mix(c01, c23, t.y);
}

void main() {
    // Flip Y-coordinate for WebGL coordinate system
    // WebGL uses bottom-left as (0,0), while our UI uses top-left as (0,0)
    vec2 texCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y);

    // Determine which cell the current pixel is in
    int i = int(texCoord.x * float(u_width - 1));
    int j = int(texCoord.y * float(u_height - 1));
    
    // Calculate local coordinates within the cell
    vec2 localCoord = vec2(
        fract(texCoord.x * float(u_width - 1)),
        fract(texCoord.y * float(u_height - 1))
    );
    
    // Gather the 4 corner points, colors, and control points for this cell
    vec2 p[16];
    vec3 colors[4];
    int index = j * u_width + i;
    
    p[0] = u_points[index];
    p[3] = u_points[index + 1];
    p[12] = u_points[index + u_width];
    p[15] = u_points[index + u_width + 1];
    
    colors[0] = u_colors[index];
    colors[1] = u_colors[index + 1];
    colors[2] = u_colors[index + u_width];
    colors[3] = u_colors[index + u_width + 1];
    
    // Control points
    p[1] = p[0] + u_controlPoints[index * 4 + 1];      // right control point of p0
    p[2] = p[3] + u_controlPoints[(index + 1) * 4 + 3]; // left control point of p3
    p[4] = p[0] + u_controlPoints[index * 4 + 2];      // bottom control point of p0
    p[8] = p[12] + u_controlPoints[(index + u_width) * 4];   // top control point of p12
    
    p[7] = p[3] + u_controlPoints[(index + 1) * 4 + 2];  // bottom control point of p3
    p[11] = p[15] + u_controlPoints[(index + u_width + 1) * 4 + 3]; // left control point of p15
    p[13] = p[12] + u_controlPoints[(index + u_width) * 4 + 1]; // right control point of p12
    p[14] = p[15] + u_controlPoints[(index + u_width + 1) * 4];    // top control point of p15
    
    // Interior control points
    p[5] = mix(p[4], p[7], 0.33333);
    p[6] = mix(p[4], p[7], 0.66667);
    p[9] = mix(p[8], p[11], 0.33333);
    p[10] = mix(p[8], p[11], 0.66667);
    
    // Interpolate position
    vec2 pos = bicubicBezier(p, localCoord);
    
    // Interpolate color
    vec3 finalColor = colorInterpolation(colors[0], colors[1], colors[2], colors[3], localCoord);
    
    fragColor = vec4(finalColor, 1.0);
}
`;