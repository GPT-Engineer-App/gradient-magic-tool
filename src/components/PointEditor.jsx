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
      {['Leading', 'Top', 'Trailing', 'Bottom'].map((direction, cpIndex) => (
        <div key={direction} className="mb-4">
          <h4 className="font-medium mb-2">{direction}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`cp-${direction}-x`}>X:</Label>
              <Input
                id={`cp-${direction}-x`}
                type="number"
                min="-0.5"
                max="0.5"
                step="0.01"
                value={controlPoints[selectedPoint * 4 + cpIndex].x.toFixed(2)}
                onChange={(e) => handleControlPointChange(cpIndex, 'x', e.target.value)}
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
                value={controlPoints[selectedPoint * 4 + cpIndex].y.toFixed(2)}
                onChange={(e) => handleControlPointChange(cpIndex, 'y', e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PointEditor;