import React from 'react';

type Action =
  | {
      type: 'MOUSE_DOWN_INSIDE';
      payload: Point;
    }
  | {
      type: 'MOUSE_DOWN';
      payload: Point;
    }
  | { type: 'MOUSE_MOVE'; payload: Point }
  | {
      type: 'MOUSE_UP';
    }
  | {
      type: 'MOUSE_LEAVE';
    }
  | {
      type: 'MOUSE_LEAVE';
    };

type Dimensions = {
  start: Point;
  current: Point;
};
type Bounds = {
  left: number;
  right: number;
  lower: number;
  upper: number;
};

type Rect = {
  width: number;
  height: number;
  x: number;
  y: number;
};

type Point = [number, number];

type ClosedBrush = Dimensions & {
  status: 'CLOSED';
  selection: Dimensions;
};
type BrushingBrush = Dimensions & {
  status: 'BRUSHING' | 'BRUSH_START' | 'BRUSH_END';
};
type DraggingBrush = Dimensions & {
  status: 'DRAG_START' | 'DRAGGING' | 'DRAG_END';
  previousPosition: Point;
};

type Brush = BrushingBrush | ClosedBrush | DraggingBrush;

const dimsToRect = <T extends Dimensions>(dims: T): Rect => {
  const {
    start: [xS, yS],
    current: [xC, yC],
  } = dims;
  const x = Math.min(xS, xC);
  const y = Math.min(yS, yC);
  const width = Math.max(xS, xC) - x;
  const height = Math.max(yS, yC) - y;
  return { x, y, width, height };
};
const inBounds = (bounds: Bounds) => (point: Point) => {
  const [x, y] = point;
  const { left, right, upper, lower } = bounds;
  return (x - left) * (x - right) < 0 && (y - lower) * (y - upper) < 0;
};

const dimsToBounds = <T extends Dimensions>(dims: T): Bounds => {
  const {
    start: [xS, yS],
    current: [xC, yC],
  } = dims;
  return {
    left: Math.min(xS, xC),
    right: Math.max(xS, xC),
    upper: Math.min(yS, yC),
    lower: Math.max(yS, yC),
  };
};

function getCoordsFromEvent(
  node: SVGSVGElement,
  event: React.MouseEvent
): Point | null {
  if (!node) return null;
  const svg = node.ownerSVGElement || node;
  if (svg.createSVGPoint) {
    let point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    point = point.matrixTransform(node.getScreenCTM()!.inverse());
    return [point.x, point.y];
  }
  const rect = node.getBoundingClientRect();
  return [
    event.clientX - rect.left - node.clientLeft,
    event.clientY - rect.top - node.clientTop,
  ];
}

const closeBrush = (brush: Brush): ClosedBrush => {
  return {
    status: 'CLOSED',
    start: [0, 0],
    current: [0, 0],
    selection: {
      start: brush.start,
      current: brush.current,
    },
  };
};

const sizeBrush = (brush: Brush, point: Point): BrushingBrush => {
  return {
    status: 'BRUSHING',
    start: brush.start,
    current: point,
  };
};

function reducer(state: Brush, action: Action): Brush {
  switch (action.type) {
    case 'MOUSE_DOWN':
      return {
        start: action.payload,
        current: action.payload,
        status: 'BRUSH_START',
      };
    case 'MOUSE_MOVE':
      return state.status === 'BRUSHING' || state.status === 'BRUSH_START'
        ? sizeBrush(state, action.payload)
        : state;
    case 'MOUSE_UP':
      return closeBrush(state);
    case 'MOUSE_LEAVE':
      return state;
    default:
      return state;
  }
}

const addPoints = (pointA: Point, pointB: Point): Point => [
  pointA[0] + pointB[0],
  pointA[1] + pointB[1],
];

const moveBrush = (point: Point, brush: DraggingBrush): DraggingBrush => {
  const diff: Point = [
    point[0] - brush.previousPosition[0],
    point[1] - brush.previousPosition[1],
  ];
  return {
    status: 'DRAGGING',
    start: addPoints(brush.start, diff),
    current: addPoints(brush.current, diff),
    previousPosition: point,
  };
};

function dragReducer(state: Brush, action: Action): Brush {
  switch (action.type) {
    case 'MOUSE_DOWN':
      return {
        status: 'BRUSH_START',
        start: action.payload,
        current: action.payload,
      };
    case 'MOUSE_DOWN_INSIDE':
      return {
        ...state,
        status: 'DRAG_START',
        previousPosition: action.payload,
      };
    case 'MOUSE_MOVE':
      return state.status === 'BRUSHING' || state.status === 'BRUSH_START'
        ? sizeBrush(state, action.payload)
        : state.status === 'DRAG_START' || state.status === 'DRAGGING'
        ? moveBrush(action.payload, state)
        : { ...state };
    case 'MOUSE_UP':
      return state.status === 'BRUSHING'
        ? { ...state, status: 'BRUSH_END' }
        : state.status === 'DRAGGING'
        ? { ...state, status: 'DRAG_END' }
        : { ...state };
    case 'MOUSE_LEAVE':
      return state;
    default:
      return state;
  }
}

const initialState: Brush = {
  start: [0, 0],
  current: [0, 0],
  status: 'CLOSED',
  selection: { start: [0, 0], current: [0, 0] },
};
const getSelection = (brush: Brush): Bounds => {
  if (brush.status === 'CLOSED') return dimsToBounds(brush.selection);
  return dimsToBounds(brush);
};

const useBrush = (isDragging = true) => {
  const [state, dispatch] = React.useReducer(
    isDragging ? dragReducer : reducer,
    initialState
  );
  const ref = React.useRef<null | SVGElement>();
  const rectRef = React.useRef<null | SVGElement>();

  const onMouseDown = (e: React.MouseEvent<SVGElement>) => {
    e.persist();
    const coords = getCoordsFromEvent(ref.current as SVGSVGElement, e);
    if (rectRef.current && !rectRef.current.contains(e.target as Node)) {
      dispatch({ type: 'MOUSE_DOWN', payload: coords! });
    } else {
      dispatch({ type: 'MOUSE_DOWN_INSIDE', payload: coords! });
    }
  };
  const onMouseUp = () => {
    dispatch({ type: 'MOUSE_UP' });
  };
  const onMouseMove = (e: React.MouseEvent<SVGElement>) => {
    const coords = getCoordsFromEvent(ref.current as SVGSVGElement, e);
    dispatch({ type: 'MOUSE_MOVE', payload: coords! });
  };
  const onMouseLeave = () => {
    dispatch({ type: 'MOUSE_LEAVE' });
  };

  React.useEffect(() => {
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  });

  const bind = { onMouseDown, onMouseMove, onMouseLeave, ref };
  const selection = getSelection(state);
  const rect = dimsToRect(state);
  // console.log(state);
  return [state, rect, rectRef, bind, selection] as const;
};

export { useBrush, reducer, Action, Brush, inBounds };
