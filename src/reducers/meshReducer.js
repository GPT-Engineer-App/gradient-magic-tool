import { clamp } from '../utils/mathUtils';

const createInitialState = (width = 3, height = 3) => {
  const points = Array.from({ length: width * height }, (_, index) => ({
    x: (index % width) / (width - 1),
    y: Math.floor(index / width) / (height - 1)
  }));

  const colors = Array.from({ length: width * height }, () => 
    `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
  );

  const controlPoints = Array.from({ length: width * height }, () => ({
    top: { x: 0, y: -0.1 },
    right: { x: 0.1, y: 0 },
    bottom: { x: 0, y: 0.1 },
    left: { x: -0.1, y: 0 }
  }));

  return { width, height, points, colors, controlPoints };
};

const meshReducer = (state, action) => {
  switch (action.type) {
    case 'SET_DIMENSIONS':
      if (action.width < 1 || action.height < 1) {
        console.error('Invalid dimensions');
        return state;
      }
      return createInitialState(action.width, action.height);

    case 'MOVE_POINT':
      if (action.index < 0 || action.index >= state.points.length) {
        console.error('Invalid point index');
        return state;
      }
      const newPoints = [...state.points];
      newPoints[action.index] = {
        x: clamp(action.x, 0, 1),
        y: clamp(action.y, 0, 1)
      };
      return { ...state, points: newPoints };

    case 'SET_COLOR':
      if (action.index < 0 || action.index >= state.colors.length) {
        console.error('Invalid color index');
        return state;
      }
      const newColors = [...state.colors];
      newColors[action.index] = action.color;
      return { ...state, colors: newColors };

    case 'UPDATE_CONTROL_POINT':
      if (action.pointIndex < 0 || action.pointIndex >= state.controlPoints.length) {
        console.error('Invalid control point index');
        return state;
      }
      const newControlPoints = [...state.controlPoints];
      newControlPoints[action.pointIndex] = {
        ...newControlPoints[action.pointIndex],
        [action.direction]: {
          x: clamp(action.x, -0.5, 0.5),
          y: clamp(action.y, -0.5, 0.5)
        }
      };
      return { ...state, controlPoints: newControlPoints };

    default:
      return state;
  }
};

export { createInitialState, meshReducer };