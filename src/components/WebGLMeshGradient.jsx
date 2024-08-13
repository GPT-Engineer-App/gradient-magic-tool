import React, { useEffect, useRef } from 'react';

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_position * 0.5 + 0.5;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform vec2 u_points[9];
  uniform vec3 u_colors[9];
  
  vec3 interpolateColor(vec2 p) {
    float totalWeight = 0.0;
    vec3 color = vec3(0.0);
    
    for (int i = 0; i < 9; i++) {
      float d = distance(p, u_points[i]);
      float weight = 1.0 / (d * d + 0.00001);
      totalWeight += weight;
      color += weight * u_colors[i];
    }
    
    return color / totalWeight;
  }
  
  void main() {
    vec3 color = interpolateColor(v_texCoord);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const WebGLMeshGradient = ({ width, height, points, colors }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

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

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [points, colors]);

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