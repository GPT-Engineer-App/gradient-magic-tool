import React from 'react';

const PointsOverlay = ({ points, colors, selectedPoint, setSelectedPoint, handlePointDrag }) => {
  return (
    <svg className="absolute top-0 left-0 w-full h-full overflow-visible" preserveAspectRatio="xMidYMid meet">
      {points.map((point, index) => (
        <circle
          key={index}
          cx={`${point.x * 100}%`}
          cy={`${point.y * 100}%`}
          r="8"
          fill={colors[index]}
          stroke={index === selectedPoint ? "white" : "transparent"}
          strokeWidth="2"
          style={{ cursor: 'pointer' }}
          onMouseDown={(e) => {
            e.preventDefault();
            setSelectedPoint(index);
            const svg = e.target.ownerSVGElement;
            if (!svg) return;

            const startDrag = (e) => {
              const rect = svg.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width;
              const y = (e.clientY - rect.top) / rect.height;
              handlePointDrag(index, Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y)));
            };

            const stopDrag = () => {
              window.removeEventListener('mousemove', startDrag);
              window.removeEventListener('mouseup', stopDrag);
            };

            window.addEventListener('mousemove', startDrag);
            window.addEventListener('mouseup', stopDrag);
          }}
        />
      ))}
    </svg>
  );
};

export default PointsOverlay;