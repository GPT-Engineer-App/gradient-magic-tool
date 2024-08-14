import React, { useReducer } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WebGLMeshGradient, { shaderOptions } from '@/components/WebGLMeshGradient';
import PointsOverlay from '@/components/PointsOverlay';
import PointEditor from '@/components/PointEditor';
import { createInitialState, meshReducer } from '../reducers/meshReducer';

const Index = () => {
  const [meshState, dispatch] = useReducer(meshReducer, 3, createInitialState);
  const [renderer, setRenderer] = React.useState('webgl');
  const [selectedPoint, setSelectedPoint] = React.useState(0);
  const [selectedShader, setSelectedShader] = React.useState('original');
  const containerRef = React.useRef(null);

  React.useEffect(() => {
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
    dispatch({ type: 'MOVE_POINT', index, x: newX, y: newY });
    setSelectedPoint(index);
  };

  const handleControlPointDrag = (pointIndex, direction, newX, newY) => {
    dispatch({ type: 'UPDATE_CONTROL_POINT', pointIndex, direction, x: newX, y: newY });
  };

  const handleColorChange = (newColor) => {
    dispatch({ type: 'SET_COLOR', index: selectedPoint, color: newColor });
  };

  const handleControlPointChange = (direction, axis, value) => {
    const currentControlPoint = meshState.controlPoints[selectedPoint][direction];
    dispatch({
      type: 'UPDATE_CONTROL_POINT',
      pointIndex: selectedPoint,
      direction,
      x: axis === 'x' ? parseFloat(value) : currentControlPoint.x,
      y: axis === 'y' ? parseFloat(value) : currentControlPoint.y
    });
  };

  const handlePointPositionChange = (axis, value) => {
    const currentPoint = meshState.points[selectedPoint];
    dispatch({
      type: 'MOVE_POINT',
      index: selectedPoint,
      x: axis === 'x' ? parseFloat(value) : currentPoint.x,
      y: axis === 'y' ? parseFloat(value) : currentPoint.y
    });
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
      {renderer === 'webgl' && (
        <div className="mb-4">
          <Label htmlFor="shader-select">Shader:</Label>
          <Select value={selectedShader} onValueChange={setSelectedShader}>
            <SelectTrigger id="shader-select">
              <SelectValue placeholder="Select shader" />
            </SelectTrigger>
            <SelectContent>
              {shaderOptions.map(option => (
                <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2 relative" ref={containerRef}>
          <div className="aspect-square relative overflow-visible">
            <WebGLMeshGradient
              width={meshState.width}
              height={meshState.height}
              points={meshState.points}
              colors={meshState.colors}
              controlPoints={meshState.controlPoints}
              selectedShader={selectedShader}
            />
            <PointsOverlay
              points={meshState.points}
              colors={meshState.colors}
              selectedPoint={selectedPoint}
              setSelectedPoint={setSelectedPoint}
              handlePointDrag={handlePointDrag}
              controlPoints={meshState.controlPoints}
              handleControlPointDrag={handleControlPointDrag}
            />
          </div>
        </div>
        <div className="w-full md:w-1/2">
          <PointEditor
            selectedPoint={selectedPoint}
            points={meshState.points}
            colors={meshState.colors}
            controlPoints={meshState.controlPoints}
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