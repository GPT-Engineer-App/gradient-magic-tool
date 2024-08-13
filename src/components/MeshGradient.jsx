import React, { useEffect, useRef } from 'react';

const MeshGradient = ({ width, height, points, colors }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawMeshGradient = () => {
      const cols = width;
      const rows = height;

      for (let i = 0; i < rows - 1; i++) {
        for (let j = 0; j < cols - 1; j++) {
          const index = i * cols + j;
          const topLeft = points[index];
          const topRight = points[index + 1];
          const bottomLeft = points[index + cols];
          const bottomRight = points[index + cols + 1];

          const colorTopLeft = colors[index];
          const colorTopRight = colors[index + 1];
          const colorBottomLeft = colors[index + cols];
          const colorBottomRight = colors[index + cols + 1];

          const gradient = ctx.createConicGradient(0, topLeft.x * canvas.width, topLeft.y * canvas.height);
          gradient.addColorStop(0, colorTopLeft);
          gradient.addColorStop(0.25, colorTopRight);
          gradient.addColorStop(0.5, colorBottomRight);
          gradient.addColorStop(0.75, colorBottomLeft);
          gradient.addColorStop(1, colorTopLeft);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(topLeft.x * canvas.width, topLeft.y * canvas.height);
          ctx.lineTo(topRight.x * canvas.width, topRight.y * canvas.height);
          ctx.lineTo(bottomRight.x * canvas.width, bottomRight.y * canvas.height);
          ctx.lineTo(bottomLeft.x * canvas.width, bottomLeft.y * canvas.height);
          ctx.closePath();
          ctx.fill();
        }
      }
    };

    drawMeshGradient();
  }, [width, height, points, colors]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className="w-full h-auto border border-gray-300 rounded-lg shadow-lg"
    />
  );
};

export default MeshGradient;