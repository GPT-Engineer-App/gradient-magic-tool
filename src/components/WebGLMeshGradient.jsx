import React, { useEffect, useRef } from 'react';

const vertexShaderSource = `#version 300 es
  in vec2 a_position;
  out vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_position * 0.5 + 0.5;
  }
`;

const fragmentShaderSource = `#version 300 es
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
vec3 colorInterpolation(vec3 c0, vec3 c1, vec3 c2, vec3 c3, float t) {
    float t2 = t * t;
    float t3 = t2 * t;
    float mt = 1.0 - t;
    float mt2 = mt * mt;
    float mt3 = mt2 * mt;
    return mt3 * c0 + 3.0 * mt2 * t * c1 + 3.0 * mt * t2 * c2 + t3 * c3;
}

void main() {
    // IMPORTANT: WebGL's coordinate system has (0,0) at the bottom-left, while our UI uses top-left
    // We need to flip the Y-coordinate here to match our UI coordinate system
    vec2 flippedTexCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
    
    // Determine which cell the current pixel is in
    int i = int(flippedTexCoord.x * float(u_width - 1));
    int j = int(flippedTexCoord.y * float(u_height - 1));
    
    // Calculate local coordinates within the cell
    vec2 localCoord = vec2(
        fract(flippedTexCoord.x * float(u_width - 1)),
        fract(flippedTexCoord.y * float(u_height - 1))
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
    vec3 colorTop = colorInterpolation(colors[0], mix(colors[0], colors[1], 0.33333),
                                       mix(colors[0], colors[1], 0.66667), colors[1], localCoord.x);
    vec3 colorBottom = colorInterpolation(colors[2], mix(colors[2], colors[3], 0.33333),
                                          mix(colors[2], colors[3], 0.66667), colors[3], localCoord.x);
    vec3 finalColor = colorInterpolation(colorTop, mix(colorTop, colorBottom, 0.33333),
                                         mix(colorTop, colorBottom, 0.66667), colorBottom, localCoord.y);
    
    fragColor = vec4(finalColor, 1.0);
}
`;

const WebGLMeshGradient = ({ width, height, points, colors, controlPoints }) => {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const uniformLocationsRef = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    let gl = canvas.getContext('webgl2');

    if (!gl) {
      console.error('WebGL 2 not supported');
      return;
    }

    const compileShader = (gl, source, type) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) {
      console.error('Shader compilation failed');
      return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return;
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1, -1,
      1, -1,
      -1, 1,
      1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Store references
    glRef.current = gl;
    programRef.current = program;

    // Store uniform locations
    uniformLocationsRef.current = {
      points: gl.getUniformLocation(program, 'u_points'),
      colors: gl.getUniformLocation(program, 'u_colors'),
      controlPoints: gl.getUniformLocation(program, 'u_controlPoints'),
      width: gl.getUniformLocation(program, 'u_width'),
      height: gl.getUniformLocation(program, 'u_height'),
    };

    // Cleanup function
    return () => {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    gl.useProgram(program);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    updateUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Debug: Log points after updating uniforms
    console.log('Points after update:', points);
  }, [width, height, points, colors, controlPoints]); // Re-run when these props change

  const updateUniforms = () => {
    const gl = glRef.current;
    const uniformLocations = uniformLocationsRef.current;
    if (!gl || !uniformLocations) return;

    // IMPORTANT: WebGL's coordinate system has (0,0) at the bottom-left, while our UI uses top-left
    // We need to flip the Y-axis once when passing point coordinates to WebGL
    const flatPoints = points.flatMap(p => [p.x, 1.0 - p.y]);
    gl.uniform2fv(uniformLocations.points, flatPoints);

    // Debug: Log flat points
    console.log('Flat points:', flatPoints);

    const flatColors = colors.flatMap(c => {
      const hex = c.replace('#', '');
      return [
        parseInt(hex.substr(0, 2), 16) / 255,
        parseInt(hex.substr(2, 2), 16) / 255,
        parseInt(hex.substr(4, 2), 16) / 255,
      ];
    });
    gl.uniform3fv(uniformLocations.colors, flatColors);

    // IMPORTANT: Control points are relative offsets, so we don't flip their Y-axis
    const flatControlPoints = controlPoints.flatMap(cp => [
      cp.top.x, cp.top.y,
      cp.right.x, cp.right.y,
      cp.bottom.x, cp.bottom.y,
      cp.left.x, cp.left.y
    ]);
    gl.uniform2fv(uniformLocations.controlPoints, flatControlPoints);

    gl.uniform1i(uniformLocations.width, width);
    gl.uniform1i(uniformLocations.height, height);

    // Debug: Log uniform values
    console.log('Uniform values:', {
      points: flatPoints,
      colors: flatColors,
      controlPoints: flatControlPoints,
      width,
      height
    });
  };

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className="w-full h-auto border border-gray-300 rounded-lg shadow-lg"
    />
  );
};

export default WebGLMeshGradient;