import React, { useState } from 'react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
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
  const [renderer, setRenderer] = useState('canvas');

  const handlePointChange = (index, axis, value) => {
    const newPoints = [...points];
    newPoints[index][axis] = value / 100;
    setPoints(newPoints);
  };

  const handleColorChange = (index, newColor) => {
    const newColors = [...colors];
    newColors[index] = newColor;
    setColors(newColors);
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
        <div className="w-full md:w-1/2">
          <GradientComponent width={meshWidth} height={meshHeight} points={points} colors={colors} />
        </div>
        <div className="w-full md:w-1/2">
          {points.map((point, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-100 rounded-lg">
              <div className="flex items-center mb-2">
                <Label htmlFor={`color-${index}`} className="mr-2">Color {index + 1}:</Label>
                <Input
                  id={`color-${index}`}
                  type="color"
                  value={colors[index]}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  className="w-16 h-8"
                />
              </div>
              <div className="mb-2">
                <Label htmlFor={`x-${index}`}>X Position: {Math.round(point.x * 100)}%</Label>
                <Slider
                  id={`x-${index}`}
                  min={0}
                  max={100}
                  step={1}
                  value={[point.x * 100]}
                  onValueChange={(value) => handlePointChange(index, 'x', value[0])}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor={`y-${index}`}>Y Position: {Math.round(point.y * 100)}%</Label>
                <Slider
                  id={`y-${index}`}
                  min={0}
                  max={100}
                  step={1}
                  value={[point.y * 100]}
                  onValueChange={(value) => handlePointChange(index, 'y', value[0])}
                  className="mt-2"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;