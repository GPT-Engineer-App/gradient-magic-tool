import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"

const Index = () => {
  const [colors, setColors] = useState(['#ff0000', '#00ff00', '#0000ff', '#ffff00']);
  const [positions, setPositions] = useState([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 0, y: 100 },
    { x: 100, y: 100 },
  ]);
  const [cssOutput, setCssOutput] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    drawGradient();
  }, [colors, positions]);

  const drawGradient = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create a larger gradient area
    const gradientSize = Math.max(canvas.width, canvas.height) * 1.5;

    colors.forEach((color, index) => {
      const x = (positions[index].x / 100) * canvas.width;
      const y = (positions[index].y / 100) * canvas.height;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, gradientSize);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, color + '00'); // Full transparency at the edge

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    generateCSS();
  };

  const generateCSS = () => {
    const gradientSize = 150; // Percentage, matching the canvas drawing
    const gradientStops = colors.map((color, index) => {
      const x = positions[index].x;
      const y = positions[index].y;
      return `radial-gradient(circle at ${x}% ${y}%, ${color} 0%, ${color}00 ${gradientSize}%)`;
    });

    const css = `
background-color: ${colors[0]};
background-image: ${gradientStops.join(', ')};
background-size: 100% 100%;
background-repeat: no-repeat;
    `.trim();

    setCssOutput(css);
  };

  const handleColorChange = (index, newColor) => {
    const newColors = [...colors];
    newColors[index] = newColor;
    setColors(newColors);
  };

  const handlePositionChange = (index, axis, value) => {
    const newPositions = [...positions];
    newPositions[index][axis] = value;
    setPositions(newPositions);
  };

  const handleAddColor = () => {
    if (colors.length < 6) {
      setColors([...colors, '#ffffff']);
      setPositions([...positions, { x: 50, y: 50 }]);
    } else {
      toast.error("Maximum of 6 colors allowed");
    }
  };

  const handleRemoveColor = (index) => {
    if (colors.length > 2) {
      const newColors = colors.filter((_, i) => i !== index);
      const newPositions = positions.filter((_, i) => i !== index);
      setColors(newColors);
      setPositions(newPositions);
    } else {
      toast.error("Minimum of 2 colors required");
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
          <canvas
            ref={canvasRef}
            width="400"
            height="400"
            className="w-full h-auto border border-gray-300 rounded-lg shadow-lg"
          />
        </div>
        <div className="w-full md:w-1/2">
          <div className="mb-4">
            <Button onClick={handleAddColor} className="mr-2">Add Color</Button>
            <Button onClick={copyToClipboard}>Copy CSS</Button>
          </div>
          {colors.map((color, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-100 rounded-lg">
              <div className="flex items-center mb-2">
                <Label htmlFor={`color-${index}`} className="mr-2">Color {index + 1}:</Label>
                <Input
                  id={`color-${index}`}
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  className="w-16 h-8"
                />
                <Button onClick={() => handleRemoveColor(index)} className="ml-2" variant="destructive">Remove</Button>
              </div>
              <div className="mb-2">
                <Label htmlFor={`x-${index}`}>X Position: {positions[index].x}%</Label>
                <Slider
                  id={`x-${index}`}
                  min={0}
                  max={100}
                  step={1}
                  value={[positions[index].x]}
                  onValueChange={(value) => handlePositionChange(index, 'x', value[0])}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor={`y-${index}`}>Y Position: {positions[index].y}%</Label>
                <Slider
                  id={`y-${index}`}
                  min={0}
                  max={100}
                  step={1}
                  value={[positions[index].y]}
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