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

vec2 bezierInterpolate(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
    float t2 = t * t;
    float t3 = t2 * t;
    float mt = 1.0 - t;
    float mt2 = mt * mt;
    float mt3 = mt2 * mt;
    return mt3 * p0 + 3.0 * mt2 * t * p1 + 3.0 * mt * t2 * p2 + t3 * p3;
}

vec3 colorBezierInterpolate(vec3 c0, vec3 c1, vec3 c2, vec3 c3, float t) {
    float t2 = t * t;
    float t3 = t2 * t;
    float mt = 1.0 - t;
    float mt2 = mt * mt;
    float mt3 = mt2 * mt;
    return mt3 * c0 + 3.0 * mt2 * t * c1 + 3.0 * mt * t2 * c2 + t3 * c3;
}

void main() {
    // Determine which cell the current pixel is in
    int i = int(v_texCoord.x * float(u_width - 1));
    int j = int(v_texCoord.y * float(u_height - 1));
    
    // Calculate local coordinates within the cell
    vec2 localCoord = fract(v_texCoord * vec2(float(u_width - 1), float(u_height - 1)));
    
    // Gather the 4 corner points and colors for this cell
    vec2 p00 = u_points[j * u_width + i];
    vec2 p10 = u_points[j * u_width + i + 1];
    vec2 p01 = u_points[(j + 1) * u_width + i];
    vec2 p11 = u_points[(j + 1) * u_width + i + 1];
    
    vec3 c00 = u_colors[j * u_width + i];
    vec3 c10 = u_colors[j * u_width + i + 1];
    vec3 c01 = u_colors[(j + 1) * u_width + i];
    vec3 c11 = u_colors[(j + 1) * u_width + i + 1];
    
    // Gather control points
    vec2 cp00_10 = p00 + u_controlPoints[(j * u_width + i) * 4 + 1]; // right control point of p00
    vec2 cp10_00 = p10 + u_controlPoints[(j * u_width + i + 1) * 4 + 3]; // left control point of p10
    vec2 cp00_01 = p00 + u_controlPoints[(j * u_width + i) * 4 + 2]; // bottom control point of p00
    vec2 cp01_00 = p01 + u_controlPoints[((j + 1) * u_width + i) * 4]; // top control point of p01
    
    // Interpolate along x-axis
    vec2 p0 = bezierInterpolate(p00, cp00_10, cp10_00, p10, localCoord.x);
    vec2 p1 = bezierInterpolate(p01, cp01_00, cp00_01, p11, localCoord.x);
    
    // Interpolate along y-axis
    vec2 p = bezierInterpolate(p0, p0, p1, p1, localCoord.y);
    
    // Color interpolation
    vec3 c0 = colorBezierInterpolate(c00, mix(c00, c10, 0.33), mix(c00, c10, 0.66), c10, localCoord.x);
    vec3 c1 = colorBezierInterpolate(c01, mix(c01, c11, 0.33), mix(c01, c11, 0.66), c11, localCoord.x);
    vec3 c = colorBezierInterpolate(c0, mix(c0, c1, 0.33), mix(c0, c1, 0.66), c1, localCoord.y);
    
    fragColor = vec4(c, 1.0);
}
`;

const WebGLMeshGradient = ({ width, height, points, colors, controlPoints }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // TODO: Implement dynamic shader generation based on width and height
    if (width !== 3 || height !== 3) {
      console.error('Currently only 3x3 grids are supported');
      return;
    }

    if (points.length !== 9 || colors.length !== 9 || controlPoints.length !== 9) {
      console.error('Incorrect number of points, colors, or control points');
      return;
    }

    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2');

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

    const pointsUniformLocation = gl.getUniformLocation(program, 'u_points');
    const colorsUniformLocation = gl.getUniformLocation(program, 'u_colors');
    const controlPointsUniformLocation = gl.getUniformLocation(program, 'u_controlPoints');
    const widthUniformLocation = gl.getUniformLocation(program, 'u_width');
    const heightUniformLocation = gl.getUniformLocation(program, 'u_height');

    gl.useProgram(program);

    const flatPoints = points.flatMap(p => [p.x, p.y]);
    gl.uniform2fv(pointsUniformLocation, flatPoints);

    const flatColors = colors.flatMap(c => {
      const hex = c.replace('#', '');
      return [
        parseInt(hex.substr(0, 2), 16) / 255,
        parseInt(hex.substr(2, 2), 16) / 255,
        parseInt(hex.substr(4, 2), 16) / 255,
      ];
    });
    gl.uniform3fv(colorsUniformLocation, flatColors);

    const flatControlPoints = controlPoints.flatMap(cp => [
      cp.top.x, cp.top.y,
      cp.right.x, cp.right.y,
      cp.bottom.x, cp.bottom.y,
      cp.left.x, cp.left.y
    ]);
    gl.uniform2fv(controlPointsUniformLocation, flatControlPoints);

    gl.uniform1i(widthUniformLocation, width);
    gl.uniform1i(heightUniformLocation, height);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  }, [width, height, points, colors, controlPoints]);

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