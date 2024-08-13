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

uniform vec2 u_points[];
uniform vec3 u_colors[];
uniform vec2 u_controlPoints[];
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

vec2 bicubicInterpolate(vec2 p[16], float u, float v) {
    vec2 temp[4];
    for (int i = 0; i < 4; i++) {
        temp[i] = bezierInterpolate(p[i*4], p[i*4+1], p[i*4+2], p[i*4+3], u);
    }
    return bezierInterpolate(temp[0], temp[1], temp[2], temp[3], v);
}

void main() {
    // Determine which cell the current pixel is in
    float cellWidth = 1.0 / float(u_width - 1);
    float cellHeight = 1.0 / float(u_height - 1);
    int i = int(v_texCoord.x / cellWidth);
    int j = int(v_texCoord.y / cellHeight);
    
    // Calculate local coordinates within the cell
    vec2 localCoord = (v_texCoord - vec2(float(i) * cellWidth, float(j) * cellHeight)) / vec2(cellWidth, cellHeight);
    
    // Gather the 16 control points for this cell
    vec2 cellPoints[16];
    for (int y = 0; y < 4; y++) {
        for (int x = 0; x < 4; x++) {
            int index = (j + y) * u_width + (i + x);
            if (x == 0 && y == 0) cellPoints[y*4+x] = u_points[index];
            else if (x == 1 && y == 0) cellPoints[y*4+x] = u_points[index] + u_controlPoints[index*4+1];
            else if (x == 2 && y == 0) cellPoints[y*4+x] = u_points[index+1] + u_controlPoints[(index+1)*4+3];
            else if (x == 3 && y == 0) cellPoints[y*4+x] = u_points[index+1];
            else if (x == 0 && y == 1) cellPoints[y*4+x] = u_points[index] + u_controlPoints[index*4];
            else if (x == 3 && y == 1) cellPoints[y*4+x] = u_points[index+1] + u_controlPoints[(index+1)*4+2];
            else if (x == 0 && y == 2) cellPoints[y*4+x] = u_points[index+u_width] + u_controlPoints[(index+u_width)*4+1];
            else if (x == 3 && y == 2) cellPoints[y*4+x] = u_points[index+u_width+1] + u_controlPoints[(index+u_width+1)*4+3];
            else if (x == 0 && y == 3) cellPoints[y*4+x] = u_points[index+u_width];
            else if (x == 1 && y == 3) cellPoints[y*4+x] = u_points[index+u_width] + u_controlPoints[(index+u_width)*4];
            else if (x == 2 && y == 3) cellPoints[y*4+x] = u_points[index+u_width+1] + u_controlPoints[(index+u_width+1)*4+2];
            else if (x == 3 && y == 3) cellPoints[y*4+x] = u_points[index+u_width+1];
        }
    }
    
    // Perform bicubic interpolation
    vec2 interpolatedPoint = bicubicInterpolate(cellPoints, localCoord.x, localCoord.y);
    
    // Blend colors based on the interpolated position
    vec3 color = mix(
        mix(u_colors[j*u_width+i], u_colors[j*u_width+i+1], interpolatedPoint.x),
        mix(u_colors[(j+1)*u_width+i], u_colors[(j+1)*u_width+i+1], interpolatedPoint.x),
        interpolatedPoint.y
    );
    
    fragColor = vec4(color, 1.0);
}
`;

const WebGLMeshGradient = ({ width, height, points, colors, controlPoints }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
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

    const flatControlPoints = points.flatMap((_, index) => [
      controlPoints[index].top.x, controlPoints[index].top.y,
      controlPoints[index].right.x, controlPoints[index].right.y,
      controlPoints[index].bottom.x, controlPoints[index].bottom.y,
      controlPoints[index].left.x, controlPoints[index].left.y
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