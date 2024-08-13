import React from 'react';
import MeshGradient from './MeshGradient';
import WebGLMeshGradient from './WebGLMeshGradient';

const GradientRenderer = ({ renderer, meshWidth, meshHeight, points, colors, controlPoints }) => {
  const GradientComponent = renderer === 'canvas' ? MeshGradient : WebGLMeshGradient;

  return (
    <div className="aspect-square relative overflow-visible">
      <GradientComponent
        width={meshWidth}
        height={meshHeight}
        points={points}
        colors={colors}
        controlPoints={controlPoints}
      />
    </div>
  );
};

export default GradientRenderer;