import React, { useEffect, useRef } from 'react';

const MeshGradient = ({ points, width = 400, height = 400 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradientSize = Math.max(canvas.width, canvas.height) * 2;

    points.forEach(({ x, y, color }) => {
      const gradientX = (x / 100) * canvas.width;
      const gradientY = (y / 100) * canvas.height;

      const gradient = ctx.createRadialGradient(
        gradientX, gradientY, 0,
        gradientX, gradientY, gradientSize
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '00'); // Full transparency at the edge

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
  }, [points, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-auto border border-gray-300 rounded-lg shadow-lg"
    />
  );
};

export default MeshGradient;