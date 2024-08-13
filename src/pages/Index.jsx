import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import MeshGradient from '@/components/MeshGradient';

const Index = () => {
  const [meshWidth, setMeshWidth] = useState(3);
  const [meshHeight, setMeshHeight] = useState(3);
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

  const generateCSS = () => {
    // This is a simplified CSS generation. For a more accurate representation,
    // you might need to use a more complex approach or a library.
    const gradientStops = points.map((point, index) => 
      `radial-gradient(circle at ${point.x * 100}% ${point.y * 100}%, ${colors[index]} 0%, ${colors[index]}00 100%)`
    );

    return `
background-color: ${colors[0]};
background-image: ${gradientStops.join(', ')};
background-size: 100% 100%;
background-repeat: no-repeat;
    `.trim();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateCSS());
    toast.success("CSS copied to clipboard!");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Mesh Gradient Generator</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2">
          <MeshGradient width={meshWidth} height={meshHeight} points={points} colors={colors} />
        </div>
        <div className="w-full md:w-1/2">
          <div className="mb-4">
            <Button onClick={copyToClipboard}>Copy CSS</Button>
          </div>
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
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-2">Generated CSS</h2>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{generateCSS()}</code>
        </pre>
      </div>
    </div>
  );
};

export default Index;