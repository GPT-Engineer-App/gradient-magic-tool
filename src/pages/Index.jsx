import React, { useState, useRef, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GradientRenderer from '@/components/GradientRenderer';
import PointsOverlay from '@/components/PointsOverlay';
import PointEditor from '@/components/PointEditor';

const Index = () => {
  const [meshWidth] = useState(3);
  const [meshHeight] = useState(3);
  const [points, setPoints] = useState([
    {x: 0, y: 0}, {x: 0.5, y: 0}, {x: 1, y: 0},
    {x: 0, y: 0.5}, {x: 0.5, y: 0.5}, {x: 1, y: 0.5},
    {x: 0, y: 1}, {x: 0.5, y: 1}, {x: 1, y: 1}
  ]);
  const [colors, setColors] = useState([
    "#ff0000", "#800080", "#4B0082",
    "#FFA500", "#FFFFFF", "#0000FF",
    "#FFFF00", "#008000", "#3EB489"
  ]);
  const [controlPoints, setControlPoints] = useState(
    points.flatMap(() => [
      {x: 0.1, y: 0}, {x: 0, y: 0.1}, {x: -0.1, y: 0}, {x: 0, y: -0.1}
    ])
  );
  const [renderer, setRenderer] = useState('webgl');
  const [selectedPoint, setSelectedPoint] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const updateSVGViewBox = () => {
      const container = containerRef.current;
      if (container) {
        const { width, height } = container.getBoundingClientRect();
        const size = Math.min(width, height);
        container.style.width = `${size}px`;
        container.style.height = `${size}px`;
      }
    };

    updateSVGViewBox();
    window.addEventListener('resize', updateSVGViewBox);
    return () => window.removeEventListener('resize', updateSVGViewBox);
  }, []);

  const handlePointDrag = (index, newX, newY) => {
    const newPoints = [...points];
    newPoints[index] = { x: newX, y: newY };
    setPoints(newPoints);
  };

  const handleColorChange = (newColor) => {
    const newColors = [...colors];
    newColors[selectedPoint] = newColor;
    setColors(newColors);
  };

  const handleControlPointChange = (cpIndex, axis, value) => {
    const newControlPoints = [...controlPoints];
    const index = selectedPoint * 4 + cpIndex;
    newControlPoints[index][axis] = parseFloat(value);
    setControlPoints(newControlPoints);
  };

  const handlePointPositionChange = (axis, value) => {
    const newPoints = [...points];
    newPoints[selectedPoint][axis] = parseFloat(value);
    setPoints(newPoints);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Mesh Gradient Generator</h1>
      <div className="mb-4">
        <Label htmlFor="renderer-select">Renderer:</Label>
        <Select value={renderer} onValueChange={setRenderer}>
          <SelectTrigger id="renderer-select">
            <SelectValue placeholder="Select renderer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="canvas">Canvas</SelectItem>
            <SelectItem value="webgl">WebGL</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2 relative" ref={containerRef}>
          <GradientRenderer
            renderer={renderer}
            meshWidth={meshWidth}
            meshHeight={meshHeight}
            points={points}
            colors={colors}
            controlPoints={controlPoints}
          />
          <PointsOverlay
            points={points}
            colors={colors}
            selectedPoint={selectedPoint}
            setSelectedPoint={setSelectedPoint}
            handlePointDrag={handlePointDrag}
          />
        </div>
        <div className="w-full md:w-1/2">
          <PointEditor
            selectedPoint={selectedPoint}
            points={points}
            colors={colors}
            controlPoints={controlPoints}
            handleColorChange={handleColorChange}
            handlePointPositionChange={handlePointPositionChange}
            handleControlPointChange={handleControlPointChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;