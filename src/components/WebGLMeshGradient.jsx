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
  uniform vec2 u_controlPoints[36];
  
  vec2 bezier(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
    float t1 = 1.0 - t;
    return t1 * t1 * t1 * p0 + 3.0 * t1 * t1 * t * p1 + 3.0 * t1 * t * t * p2 + t * t * t * p3;
  }
  
  vec3 bezierColor(vec3 c0, vec3 c1, vec3 c2, vec3 c3, float t) {
    float t1 = 1.0 - t;
    return t1 * t1 * t1 * c0 + 3.0 * t1 * t1 * t * c1 + 3.0 * t1 * t * t * c2 + t * t * t * c3;
  }
  
  vec3 interpolateColor(vec2 p) {
    vec3 color = vec3(0.0);
    float totalWeight = 0.0;
    
    for (int i = 0; i < 4; i++) {
      vec2 p0, p1, p2, p3, q0, q1, q2, q3;
      vec3 c0, c1, c2, c3;
      
      if (i == 0) {
        p0 = u_points[0]; p3 = u_points[1]; q0 = u_points[0]; q3 = u_points[2];
        c0 = u_colors[0]; c1 = u_colors[1]; c2 = u_colors[2]; c3 = u_colors[3];
        p1 = p0 + u_controlPoints[3];
        p2 = p3 - u_controlPoints[5];
        q1 = q0 + u_controlPoints[2];
        q2 = q3 - u_controlPoints[8];
      } else if (i == 1) {
        p0 = u_points[2]; p3 = u_points[3]; q0 = u_points[2]; q3 = u_points[4];
        c0 = u_colors[2]; c1 = u_colors[3]; c2 = u_colors[4]; c3 = u_colors[5];
        p1 = p0 + u_controlPoints[11];
        p2 = p3 - u_controlPoints[13];
        q1 = q0 + u_controlPoints[10];
        q2 = q3 - u_controlPoints[16];
      } else if (i == 2) {
        p0 = u_points[4]; p3 = u_points[5]; q0 = u_points[4]; q3 = u_points[6];
        c0 = u_colors[4]; c1 = u_colors[5]; c2 = u_colors[6]; c3 = u_colors[7];
        p1 = p0 + u_controlPoints[19];
        p2 = p3 - u_controlPoints[21];
        q1 = q0 + u_controlPoints[18];
        q2 = q3 - u_controlPoints[24];
      } else {
        p0 = u_points[6]; p3 = u_points[7]; q0 = u_points[6]; q3 = u_points[0];
        c0 = u_colors[6]; c1 = u_colors[7]; c2 = u_colors[8]; c3 = u_colors[1];
        p1 = p0 + u_controlPoints[27];
        p2 = p3 - u_controlPoints[29];
        q1 = q0 + u_controlPoints[26];
        q2 = q3 - u_controlPoints[0];
      }
      
      float t = 0.0;
      float minDist = 1000.0;
      for (int j = 0; j < 10; j++) {
        float s = float(j) / 9.0;
        vec2 bp = bezier(p0, p1, p2, p3, s);
        vec2 bq = bezier(q0, q1, q2, q3, s);
        float d = distance(p, bp) + distance(p, bq);
        if (d < minDist) {
          minDist = d;
          t = s;
        }
      }
      
      vec3 bc = bezierColor(c0, mix(c0, c1, 0.33), mix(c0, c2, 0.33), mix(c1, c2, 0.5), t);
      
      float weight = 1.0 / (minDist * minDist + 0.00001);
      color += bc * weight;
      totalWeight += weight;
    }
    
    return color / totalWeight;
  }
  
  void main() {
    vec3 color = interpolateColor(v_texCoord);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const WebGLMeshGradient = ({ width, height, points, colors, controlPoints }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');

    if (!gl) {
      console.error('WebGL not supported');
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

    gl.useProgram(program);

    const flatPoints = points.flatMap(p => [p.x, 1.0 - p.y]); // Flip Y coordinate
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

    const flatControlPoints = controlPoints.flatMap(cp => [cp.x, 1.0 - cp.y]); // Flip Y coordinate
    gl.uniform2fv(controlPointsUniformLocation, flatControlPoints);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    console.log('Render complete. Points:', flatPoints);
    console.log('Colors:', flatColors);
    console.log('Control Points:', flatControlPoints);
  }, [points, colors, controlPoints]);

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