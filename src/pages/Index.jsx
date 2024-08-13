import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import MeshGradient from '@/components/MeshGradient';

const Index = () => {
  const [points, setPoints] = useState([
    { x: 0, y: 0, color: '#ff0000' },
    { x: 100, y: 0, color: '#00ff00' },
    { x: 0, y: 100, color: '#0000ff' },
    { x: 100, y: 100, color: '#ffff00' },
  ]);
  const [cssOutput, setCssOutput] = useState('');

  useEffect(() => {
    generateCSS();
  }, [points]);

  const generateCSS = () => {
    const gradientSize = 200; // Percentage, larger than the canvas
    const gradientStops = points.map(({ x, y, color }) => {
      return `radial-gradient(circle at ${x}% ${y}%, ${color} 0%, ${color}00 ${gradientSize}%)`;
    });

    const css = `
background-color: ${points[0].color};
background-image: ${gradientStops.join(', ')};
background-size: 100% 100%;
background-repeat: no-repeat;
    `.trim();

    setCssOutput(css);
  };

  const handleColorChange = (index, newColor) => {
    const newPoints = [...points];
    newPoints[index].color = newColor;
    setPoints(newPoints);
  };

  const handlePositionChange = (index, axis, value) => {
    const newPoints = [...points];
    newPoints[index][axis] = value;
    setPoints(newPoints);
  };

  const handleAddPoint = () => {
    if (points.length < 6) {
      setPoints([...points, { x: 50, y: 50, color: '#ffffff' }]);
    } else {
      toast.error("Maximum of 6 points allowed");
    }
  };

  const handleRemovePoint = (index) => {
    if (points.length > 2) {
      const newPoints = points.filter((_, i) => i !== index);
      setPoints(newPoints);
    } else {
      toast.error("Minimum of 2 points required");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cssOutput);
    toast.success("CSS copied to clipboard!");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Mesh Gradient Generator</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2">
          <MeshGradient points={points} width={400} height={400} />
        </div>
        <div className="w-full md:w-1/2">
          <div className="mb-4">
            <Button onClick={handleAddPoint} className="mr-2">Add Point</Button>
            <Button onClick={copyToClipboard}>Copy CSS</Button>
          </div>
          {points.map((point, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-100 rounded-lg">
              <div className="flex items-center mb-2">
                <Label htmlFor={`color-${index}`} className="mr-2">Color {index + 1}:</Label>
                <Input
                  id={`color-${index}`}
                  type="color"
                  value={point.color}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  className="w-16 h-8"
                />
                <Button onClick={() => handleRemovePoint(index)} className="ml-2" variant="destructive">Remove</Button>
              </div>
              <div className="mb-2">
                <Label htmlFor={`x-${index}`}>X Position: {point.x}%</Label>
                <Slider
                  id={`x-${index}`}
                  min={0}
                  max={100}
                  step={1}
                  value={[point.x]}
                  onValueChange={(value) => handlePositionChange(index, 'x', value[0])}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor={`y-${index}`}>Y Position: {point.y}%</Label>
                <Slider
                  id={`y-${index}`}
                  min={0}
                  max={100}
                  step={1}
                  value={[point.y]}
                  onValueChange={(value) => handlePositionChange(index, 'y', value[0])}
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
          <code>{cssOutput}</code>
        </pre>
      </div>
    </div>
  );
};

export default Index;