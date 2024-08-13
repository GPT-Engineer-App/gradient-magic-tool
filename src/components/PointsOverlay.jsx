import React from 'react';

const PointsOverlay = ({ points, colors, selectedPoint, setSelectedPoint, handlePointDrag, controlPoints, handleControlPointDrag }) => {
  const getControlPointPosition = (pointIndex, cpIndex) => {
    const point = points[pointIndex];
    const cp = controlPoints[pointIndex * 4 + cpIndex];
    if (!point || !cp) {
      console.error(`Invalid control point: pointIndex=${pointIndex}, cpIndex=${cpIndex}`);
      return { x: 0, y: 0 };
    }
    return {
      x: point.x + cp.x,
      y: point.y + cp.y
    };
  };

  return (
    <svg className="absolute top-0 left-0 w-full h-full overflow-visible" preserveAspectRatio="xMidYMid meet">
      {points.map((point, index) => (
        <React.Fragment key={index}>
          <circle
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
          {index === selectedPoint && controlPoints.length >= (index + 1) * 4 && (
            <>
              {[
                { index: 3, label: 'Top' },
                { index: 1, label: 'Trailing' },
                { index: 2, label: 'Leading' },
                { index: 0, label: 'Bottom' }
              ].map(({ index: cpIndex, label }) => {
                const cp = getControlPointPosition(index, cpIndex);
                return (
                  <React.Fragment key={cpIndex}>
                    <line
                      x1={`${point.x * 100}%`}
                      y1={`${point.y * 100}%`}
                      x2={`${cp.x * 100}%`}
                      y2={`${cp.y * 100}%`}
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="1"
                    />
                    <circle
                      cx={`${cp.x * 100}%`}
                      cy={`${cp.y * 100}%`}
                      r="4"
                      fill="red"
                      style={{ cursor: 'pointer' }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const svg = e.target.ownerSVGElement;
                        if (!svg) return;

                        const startDrag = (e) => {
                          const rect = svg.getBoundingClientRect();
                          const x = (e.clientX - rect.left) / rect.width - point.x;
                          const y = (e.clientY - rect.top) / rect.height - point.y;
                          handleControlPointDrag(index, cpIndex, x, y);
                        };

                        const stopDrag = () => {
                          window.removeEventListener('mousemove', startDrag);
                          window.removeEventListener('mouseup', stopDrag);
                        };

                        window.addEventListener('mousemove', startDrag);
                        window.addEventListener('mouseup', stopDrag);
                      }}
                    />
                    <text
                      x={`${cp.x * 100}%`}
                      y={`${cp.y * 100}%`}
                      dx="6"
                      dy="4"
                      fontSize="10"
                      fill="white"
                    >
                      {label}
                    </text>
                  </React.Fragment>
                );
              })}
            </>
          )}
        </React.Fragment>
      ))}
    </svg>
  );
};

export default PointsOverlay;