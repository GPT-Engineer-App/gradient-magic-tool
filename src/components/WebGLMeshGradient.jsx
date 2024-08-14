import React, { useEffect, useRef } from 'react';
import { originalVertexShader, originalFragmentShader } from '../shaders/originalShader';
import { voronoiVertexShader, voronoiFragmentShader } from '../shaders/voronoiShader';

export const shaderOptions = [
  { id: 'original', label: 'Original' },
  { id: 'voronoi', label: 'Voronoi' },
  // Add more shader options here as they become available
];

const WebGLMeshGradient = ({ width, height, points, colors, controlPoints, selectedShader }) => {
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

    const createProgram = (gl, vertexShaderSource, fragmentShaderSource) => {
      const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
      const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

      if (!vertexShader || !fragmentShader) {
        console.error('Shader compilation failed');
        return null;
      }

      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
      }

      return program;
    };

    const setupProgram = (gl, vertexShaderSource, fragmentShaderSource) => {
      const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
      if (!program) return null;

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

      return program;
    };

    let vertexShader, fragmentShader;
    switch (selectedShader) {
      case 'voronoi':
        vertexShader = voronoiVertexShader;
        fragmentShader = voronoiFragmentShader;
        break;
      case 'original':
      default:
        vertexShader = originalVertexShader;
        fragmentShader = originalFragmentShader;
    }

    const program = setupProgram(gl, vertexShader, fragmentShader);

    if (!program) return;

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
    };
  }, [selectedShader]); // Re-run when shader choice changes

  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    gl.useProgram(program);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    updateUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [width, height, points, colors, controlPoints, selectedShader]);

  const updateUniforms = () => {
    const gl = glRef.current;
    const uniformLocations = uniformLocationsRef.current;
    if (!gl || !uniformLocations) return;

    gl.uniform2fv(uniformLocations.points, points.flatMap(p => [p.x, p.y]));

    const flatColors = colors.flatMap(c => {
      const hex = c.replace('#', '');
      return [
        parseInt(hex.substr(0, 2), 16) / 255,
        parseInt(hex.substr(2, 2), 16) / 255,
        parseInt(hex.substr(4, 2), 16) / 255,
      ];
    });
    gl.uniform3fv(uniformLocations.colors, flatColors);

    const flatControlPoints = controlPoints.flatMap(cp => [
      cp.top.x, cp.top.y,
      cp.right.x, cp.right.y,
      cp.bottom.x, cp.bottom.y,
      cp.left.x, cp.left.y
    ]);
    gl.uniform2fv(uniformLocations.controlPoints, flatControlPoints);

    gl.uniform1i(uniformLocations.width, width);
    gl.uniform1i(uniformLocations.height, height);
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