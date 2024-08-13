import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const PointEditor = ({ selectedPoint, points, colors, controlPoints, handleColorChange, handlePointPositionChange, handleControlPointChange }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Edit Point {selectedPoint + 1}</h2>
      <div className="mb-4">
        <Label htmlFor="color">Color:</Label>
        <Input
          id="color"
          type="color"
          value={colors[selectedPoint]}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-full h-10"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="point-x">X:</Label>
          <Input
            id="point-x"
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={points[selectedPoint].x.toFixed(2)}
            onChange={(e) => handlePointPositionChange('x', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="point-y">Y:</Label>
          <Input
            id="point-y"
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={points[selectedPoint].y.toFixed(2)}
            onChange={(e) => handlePointPositionChange('y', e.target.value)}
          />
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2">Control Points</h3>
      <p className="text-sm text-gray-600 mb-4">
        Control points affect the curvature of the gradient between this point and its neighbors.
        Values range from -0.5 to 0.5, where 0 is a straight line and larger absolute values create more pronounced curves.
      </p>
      <div className="relative w-32 h-32 mx-auto mb-4 border border-gray-300">
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-black transform -translate-x-1/2 -translate-y-1/2"></div>
        {['top', 'right', 'bottom', 'left'].map((direction) => {
          const cp = controlPoints[selectedPoint][direction];
          const x = 50 + cp.x * 100;
          const y = 50 - cp.y * 100;
          return (
            <div
              key={direction}
              className="absolute w-2 h-2 bg-red-500 transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            ></div>
          );
        })}
      </div>
      {['top', 'right', 'bottom', 'left'].map((direction) => (
        <div key={direction} className="mb-4">
          <h4 className="font-medium mb-2">{direction.charAt(0).toUpperCase() + direction.slice(1)}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`cp-${direction}-x`}>X:</Label>
              <Input
                id={`cp-${direction}-x`}
                type="number"
                min="-0.5"
                max="0.5"
                step="0.01"
                value={controlPoints[selectedPoint][direction].x.toFixed(2)}
                onChange={(e) => handleControlPointChange(direction, 'x', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`cp-${direction}-y`}>Y:</Label>
              <Input
                id={`cp-${direction}-y`}
                type="number"
                min="-0.5"
                max="0.5"
                step="0.01"
                value={controlPoints[selectedPoint][direction].y.toFixed(2)}
                onChange={(e) => handleControlPointChange(direction, 'y', e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}
      <p className="text-sm text-gray-600 mt-4">
        Tip: Experiment with control point values to achieve different gradient effects.
        Positive values curve towards the point, while negative values curve away from it.
      </p>
    </div>
  );
};

export default PointEditor;