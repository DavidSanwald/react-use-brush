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
    const ctm = node.getScreenCTM();
    if (!ctm) return null;
    point = point.matrixTransform(ctm.inverse());
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

const sizeBrush = (
  brush: Brush,
  point: Point,
  bounds?: Bounds
): BrushingBrush => {
  let constrainedPoint = point;
  if (bounds) {
    constrainedPoint = [
      Math.max(bounds.left, Math.min(bounds.right, point[0])),
      Math.max(bounds.upper, Math.min(bounds.lower, point[1])),
    ];
  }
  return {
    status: 'BRUSHING',
    start: brush.start,
    current: constrainedPoint,
  };
};

const subtractPoints = (pointA: Point, pointB: Point): Point => [
  pointA[0] - pointB[0],
  pointA[1] - pointB[1],
];

const addPoints = (pointA: Point, pointB: Point): Point => [
  pointA[0] + pointB[0],
  pointA[1] + pointB[1],
];

const moveBrush = (
  point: Point,
  brush: DraggingBrush,
  bounds?: Bounds
): DraggingBrush => {
  const diff: Point = subtractPoints(point, brush.previousPosition);
  const newStart = addPoints(brush.start, diff);
  const newCurrent = addPoints(brush.current, diff);

  // Apply bounds constraint if provided
  if (bounds) {
    const brushWidth = Math.abs(brush.current[0] - brush.start[0]);
    const brushHeight = Math.abs(brush.current[1] - brush.start[1]);

    // Calculate constrained positions
    const minX = Math.min(newStart[0], newCurrent[0]);
    const minY = Math.min(newStart[1], newCurrent[1]);

    // Apply constraints
    const constrainedMinX = Math.max(
      bounds.left,
      Math.min(bounds.right - brushWidth, minX)
    );
    const constrainedMinY = Math.max(
      bounds.upper,
      Math.min(bounds.lower - brushHeight, minY)
    );

    // Adjust diff based on constraints
    const adjustedDiff: Point = [
      constrainedMinX - Math.min(brush.start[0], brush.current[0]),
      constrainedMinY - Math.min(brush.start[1], brush.current[1]),
    ];

    return {
      status: 'DRAGGING',
      start: addPoints(brush.start, adjustedDiff),
      current: addPoints(brush.current, adjustedDiff),
      previousPosition: point,
    };
  }

  return {
    status: 'DRAGGING',
    start: newStart,
    current: newCurrent,
    previousPosition: point,
  };
};

const getSelection = (brush: Brush): Bounds => {
  if (brush.status === 'CLOSED') return dimsToBounds(brush.selection);
  return dimsToBounds(brush);
};

function reducer(state: Brush, action: Action, bounds?: Bounds): Brush {
  switch (action.type) {
    case 'MOUSE_DOWN':
      return {
        start: action.payload,
        current: action.payload,
        status: 'BRUSH_START',
      };
    case 'MOUSE_MOVE':
      return state.status === 'BRUSHING' || state.status === 'BRUSH_START'
        ? sizeBrush(state, action.payload, bounds)
        : state;
    case 'MOUSE_UP':
      return closeBrush(state);
    case 'MOUSE_LEAVE':
      return state.status === 'BRUSHING' || state.status === 'BRUSH_START'
        ? closeBrush(state)
        : state;
    default:
      return state;
  }
}

function dragReducer(state: Brush, action: Action, bounds?: Bounds): Brush {
  switch (action.type) {
    case 'MOUSE_DOWN':
      return {
        status: 'BRUSH_START',
        start: action.payload,
        current: action.payload,
      };
    case 'MOUSE_DOWN_INSIDE':
      if (state.status === 'CLOSED' && 'selection' in state) {
        return {
          start: state.selection.start,
          current: state.selection.current,
          status: 'DRAG_START' as const,
          previousPosition: action.payload,
        };
      }
      return state;
    case 'MOUSE_MOVE':
      return state.status === 'BRUSHING' || state.status === 'BRUSH_START'
        ? sizeBrush(state, action.payload, bounds)
        : state.status === 'DRAG_START' || state.status === 'DRAGGING'
        ? moveBrush(action.payload, state, bounds)
        : { ...state };
    case 'MOUSE_UP':
      return state.status === 'BRUSHING' || state.status === 'BRUSH_START'
        ? { ...state, status: 'BRUSH_END' }
        : state.status === 'DRAGGING'
        ? { ...state, status: 'DRAG_END' }
        : { ...state };
    case 'MOUSE_LEAVE':
      return state.status === 'BRUSHING' || state.status === 'BRUSH_START'
        ? closeBrush(state)
        : state.status === 'DRAGGING' || state.status === 'DRAG_START'
        ? { ...state, status: 'DRAG_END' as const }
        : state;
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

const useBrush = ({
  inDragMode = true,
  bounds,
}: { inDragMode?: boolean; bounds?: Bounds } = {}) => {
  const [state, dispatch] = React.useReducer(
    (state: Brush, action: Action) =>
      inDragMode
        ? dragReducer(state, action, bounds)
        : reducer(state, action, bounds),
    initialState
  );
  const ref = React.useRef<SVGElement | null>(null);
  const rectRef = React.useRef<SVGElement | null>(null);

  const onMouseDown = (e: React.MouseEvent<SVGElement>) => {
    if (!ref.current) return;
    const coords = getCoordsFromEvent(ref.current as SVGSVGElement, e);
    if (!coords) return;

    if (rectRef.current && !rectRef.current.contains(e.target as Node)) {
      dispatch({ type: 'MOUSE_DOWN', payload: coords });
    } else {
      dispatch({ type: 'MOUSE_DOWN_INSIDE', payload: coords });
    }
  };
  const onMouseUp = () => {
    dispatch({ type: 'MOUSE_UP' });
  };
  const onMouseMove = (e: React.MouseEvent<SVGElement>) => {
    if (!ref.current) return;
    const coords = getCoordsFromEvent(ref.current as SVGSVGElement, e);
    if (!coords) return;
    dispatch({ type: 'MOUSE_MOVE', payload: coords });
  };
  const onMouseLeave = () => {
    dispatch({ type: 'MOUSE_LEAVE' });
  };

  React.useEffect(() => {
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, []);

  const bind = { onMouseDown, onMouseMove, onMouseLeave, ref };
  const selection = getSelection(state);
  const rect = {
    ...dimsToRect(state),
    ...(inDragMode ? {} : { pointerEvents: 'none' as const }),
  };
  return [state, rect, rectRef, bind, selection] as const;
};

export { useBrush, reducer, dragReducer, Action, Brush, inBounds };
