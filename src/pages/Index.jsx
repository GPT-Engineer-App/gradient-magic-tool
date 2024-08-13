import React, { useState, useRef, useEffect } from 'react';
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import MeshGradient from '@/components/MeshGradient';
import WebGLMeshGradient from '@/components/WebGLMeshGradient';

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
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const updateSVGViewBox = () => {
      const container = containerRef.current;
      const svg = svgRef.current;
      if (container && svg) {
        const { width, height } = container.getBoundingClientRect();
        const size = Math.min(width, height);
        svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
        svg.style.width = `${size}px`;
        svg.style.height = `${size}px`;
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

  const GradientComponent = renderer === 'canvas' ? MeshGradient : WebGLMeshGradient;

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
        <div className="w-full md:w-1/2 relative aspect-square" ref={containerRef}>
          <GradientComponent width={meshWidth} height={meshHeight} points={points} colors={colors} controlPoints={controlPoints} />
          <svg ref={svgRef} className="absolute top-0 left-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
            {points.map((point, index) => (
              <circle
                key={index}
                cx={`${point.x * 100}%`}
                cy={`${point.y * 100}%`}
                r="8"
                fill={colors[index]}
                stroke="white"
                strokeWidth="2"
                style={{cursor: 'pointer'}}
                onMouseDown={(e) => {
                  e.preventDefault();
                  const svg = svgRef.current;
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
                onClick={() => setSelectedPoint(index)}
              />
            ))}
          </svg>
        </div>
        <div className="w-full md:w-1/2">
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
                    value={controlPoints[selectedPoint * 4 + cpIndex].x}
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
                    value={controlPoints[selectedPoint * 4 + cpIndex].y}
                    onChange={(e) => handleControlPointChange(cpIndex, 'y', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;