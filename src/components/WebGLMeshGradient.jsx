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
  
  // Cubic Bezier curve calculation
  vec2 bezier(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
    float t1 = 1.0 - t;
    return t1 * t1 * t1 * p0 + 3.0 * t1 * t1 * t * p1 + 3.0 * t1 * t * t * p2 + t * t * t * p3;
  }
  
  // Signed distance to a cubic Bezier curve
  float sdBezier(vec2 pos, vec2 A, vec2 B, vec2 C, vec2 D) {
    vec2 a = B - A;
    vec2 b = C - B;
    vec2 c = D - C;
    vec2 d = b - a;
    vec2 e = c - b;
    vec2 f = d - e;
    vec2 g = pos - A;
    float t = clamp(dot(g, d) / dot(d, d), 0.0, 1.0);
    vec2 h = g - d * t;
    float y = dot(f * t, h);
    float x = dot(e, h) + y * t;
    return sqrt(dot(h, h) + x * x / (3.0 * dot(b, b))) * sign(x);
  }
  
  vec3 interpolateColor(vec2 p) {
    vec3 color = vec3(0.0);
    float totalWeight = 0.0;
    
    for (int i = 0; i < 4; i++) {
      int i0 = i * 2;
      int i1 = i0 + 1;
      int i2 = (i0 + 2) % 8;
      int i3 = (i0 + 3) % 8;
      
      vec2 p0 = u_points[i0];
      vec2 p3 = u_points[i1];
      vec3 c0 = u_colors[i0];
      vec3 c1 = u_colors[i1];
      
      // Control points for the Bezier curve
      vec2 cp1 = p0 + u_controlPoints[i0 * 4 + 1] * 0.2; // 0.2 is the control point influence factor
      vec2 cp2 = p3 - u_controlPoints[i1 * 4 + 3] * 0.2;
      
      float dist = sdBezier(p, p0, cp1, cp2, p3);
      
      // Weight calculation: inverse square distance with a small epsilon to avoid division by zero
      float weight = 1.0 / (dist * dist + 0.0001);
      
      // Smooth color transition
      color += mix(c0, c1, smoothstep(-0.05, 0.05, dist)) * weight;
      totalWeight += weight;
    }
    
    return color / totalWeight;
  }
  
  void main() {
    vec3 color = interpolateColor(v_texCoord);
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

    const flatControlPoints = controlPoints.flatMap(cp => [
      cp.right.x, -cp.right.y,
      cp.top.x, -cp.top.y,
      cp.left.x, -cp.left.y,
      cp.bottom.x, -cp.bottom.y
    ]);
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