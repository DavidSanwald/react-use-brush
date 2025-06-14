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

  if (!svg.createSVGPoint) {
    const rect = node.getBoundingClientRect();
    return [
      event.clientX - rect.left - node.clientLeft,
      event.clientY - rect.top - node.clientTop,
    ];
  }

  let point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const ctm = node.getScreenCTM();
  if (!ctm) return null;

  point = point.matrixTransform(ctm.inverse());
  return [point.x, point.y];
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

const enforceMinimumSize = (
  point: Point,
  start: Point,
  minSize: number
): Point => {
  if (minSize <= 0) return point;

  let constrainedPoint = point;
  const width = Math.abs(point[0] - start[0]);
  const height = Math.abs(point[1] - start[1]);

  if (width < minSize && width > 0) {
    constrainedPoint = [
      point[0] > start[0] ? start[0] + minSize : start[0] - minSize,
      constrainedPoint[1],
    ];
  }

  if (height < minSize && height > 0) {
    constrainedPoint = [
      constrainedPoint[0],
      point[1] > start[1] ? start[1] + minSize : start[1] - minSize,
    ];
  }

  return constrainedPoint;
};

const constrainRectangleWithinBounds = (
  start: Point,
  current: Point,
  bounds: Bounds
): { start: Point; current: Point } => {
  let constrainedCurrent: Point = [
    Math.max(bounds.left, Math.min(bounds.right, current[0])),
    Math.max(bounds.upper, Math.min(bounds.lower, current[1])),
  ];
  let constrainedStart = start;

  const minX = Math.min(constrainedStart[0], constrainedCurrent[0]);
  const maxX = Math.max(constrainedStart[0], constrainedCurrent[0]);
  const minY = Math.min(constrainedStart[1], constrainedCurrent[1]);
  const maxY = Math.max(constrainedStart[1], constrainedCurrent[1]);

  if (minX < bounds.left) {
    const diff = bounds.left - minX;
    if (constrainedStart[0] < constrainedCurrent[0]) {
      constrainedStart = [constrainedStart[0] + diff, constrainedStart[1]];
    } else {
      constrainedCurrent = [
        constrainedCurrent[0] + diff,
        constrainedCurrent[1],
      ];
    }
  }
  if (maxX > bounds.right) {
    const diff = maxX - bounds.right;
    if (constrainedStart[0] > constrainedCurrent[0]) {
      constrainedStart = [constrainedStart[0] - diff, constrainedStart[1]];
    } else {
      constrainedCurrent = [
        constrainedCurrent[0] - diff,
        constrainedCurrent[1],
      ];
    }
  }

  if (minY < bounds.upper) {
    const diff = bounds.upper - minY;
    if (constrainedStart[1] < constrainedCurrent[1]) {
      constrainedStart = [constrainedStart[0], constrainedStart[1] + diff];
    } else {
      constrainedCurrent = [
        constrainedCurrent[0],
        constrainedCurrent[1] + diff,
      ];
    }
  }
  if (maxY > bounds.lower) {
    const diff = maxY - bounds.lower;
    if (constrainedStart[1] > constrainedCurrent[1]) {
      constrainedStart = [constrainedStart[0], constrainedStart[1] - diff];
    } else {
      constrainedCurrent = [
        constrainedCurrent[0],
        constrainedCurrent[1] - diff,
      ];
    }
  }

  return { start: constrainedStart, current: constrainedCurrent };
};

const sizeBrush = (
  brush: Brush,
  point: Point,
  bounds?: Bounds,
  minSize: number = 0
): BrushingBrush => {
  let constrainedPoint = enforceMinimumSize(point, brush.start, minSize);
  let constrainedStart = brush.start;

  if (bounds) {
    const result = constrainRectangleWithinBounds(
      constrainedStart,
      constrainedPoint,
      bounds
    );
    constrainedStart = result.start;
    constrainedPoint = result.current;
  }

  return {
    status: 'BRUSHING',
    start: constrainedStart,
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

const constrainBrushExceedsBounds = (
  brush: DraggingBrush,
  newStart: Point,
  newCurrent: Point,
  bounds: Bounds,
  brushWidth: number,
  brushHeight: number,
  boundsWidth: number,
  boundsHeight: number,
  point: Point
): DraggingBrush => {
  if (brushWidth > boundsWidth) {
    const constrainedStart: Point = [bounds.left, newStart[1]];
    const constrainedCurrent: Point = [
      bounds.left + (brush.current[0] - brush.start[0]),
      newCurrent[1],
    ];

    const minY = Math.min(constrainedStart[1], constrainedCurrent[1]);
    const maxY = Math.max(constrainedStart[1], constrainedCurrent[1]);

    if (brushHeight <= boundsHeight) {
      if (minY < bounds.upper) {
        const yDiff = bounds.upper - minY;
        constrainedStart[1] += yDiff;
        constrainedCurrent[1] += yDiff;
      } else if (maxY > bounds.lower) {
        const yDiff = maxY - bounds.lower;
        constrainedStart[1] -= yDiff;
        constrainedCurrent[1] -= yDiff;
      }
    } else {
      constrainedStart[1] = bounds.upper;
      constrainedCurrent[1] =
        bounds.upper + (brush.current[1] - brush.start[1]);
    }

    return {
      status: 'DRAGGING',
      start: constrainedStart,
      current: constrainedCurrent,
      previousPosition: point,
    };
  }

  if (brushHeight > boundsHeight) {
    const constrainedStart: Point = [newStart[0], bounds.upper];
    const constrainedCurrent: Point = [
      newCurrent[0],
      bounds.upper + (brush.current[1] - brush.start[1]),
    ];

    const minX = Math.min(constrainedStart[0], constrainedCurrent[0]);
    if (minX < bounds.left) {
      const xDiff = bounds.left - minX;
      constrainedStart[0] += xDiff;
      constrainedCurrent[0] += xDiff;
    } else if (minX + brushWidth > bounds.right) {
      const xDiff = minX + brushWidth - bounds.right;
      constrainedStart[0] -= xDiff;
      constrainedCurrent[0] -= xDiff;
    }

    return {
      status: 'DRAGGING',
      start: constrainedStart,
      current: constrainedCurrent,
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

const constrainBrushWithinBounds = (
  brush: DraggingBrush,
  newStart: Point,
  newCurrent: Point,
  bounds: Bounds,
  brushWidth: number,
  brushHeight: number,
  point: Point
): DraggingBrush => {
  const minX = Math.min(newStart[0], newCurrent[0]);
  const minY = Math.min(newStart[1], newCurrent[1]);

  const constrainedMinX = Math.max(
    bounds.left,
    Math.min(bounds.right - brushWidth, minX)
  );
  const constrainedMinY = Math.max(
    bounds.upper,
    Math.min(bounds.lower - brushHeight, minY)
  );

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
};

const moveBrush = (
  point: Point,
  brush: DraggingBrush,
  bounds?: Bounds
): DraggingBrush => {
  const diff: Point = subtractPoints(point, brush.previousPosition);
  const newStart = addPoints(brush.start, diff);
  const newCurrent = addPoints(brush.current, diff);

  if (!bounds) {
    return {
      status: 'DRAGGING',
      start: newStart,
      current: newCurrent,
      previousPosition: point,
    };
  }

  const brushWidth = Math.abs(brush.current[0] - brush.start[0]);
  const brushHeight = Math.abs(brush.current[1] - brush.start[1]);
  const boundsWidth = bounds.right - bounds.left;
  const boundsHeight = bounds.lower - bounds.upper;

  if (brushWidth > boundsWidth || brushHeight > boundsHeight) {
    return constrainBrushExceedsBounds(
      brush,
      newStart,
      newCurrent,
      bounds,
      brushWidth,
      brushHeight,
      boundsWidth,
      boundsHeight,
      point
    );
  }

  return constrainBrushWithinBounds(
    brush,
    newStart,
    newCurrent,
    bounds,
    brushWidth,
    brushHeight,
    point
  );
};

const getSelection = (brush: Brush): Bounds => {
  if (brush.status === 'CLOSED') return dimsToBounds(brush.selection);
  return dimsToBounds(brush);
};

function brushReducer(
  state: Brush,
  action: Action,
  inDragMode: boolean,
  bounds?: Bounds,
  minSize: number = 0
): Brush {
  switch (action.type) {
    case 'MOUSE_DOWN':
      return {
        status: 'BRUSH_START',
        start: action.payload,
        current: action.payload,
      };

    case 'MOUSE_DOWN_INSIDE':
      if (!inDragMode || state.status !== 'CLOSED' || !('selection' in state)) {
        return state;
      }

      return {
        start: state.selection.start,
        current: state.selection.current,
        status: 'DRAG_START' as const,
        previousPosition: action.payload,
      };

    case 'MOUSE_MOVE':
      if (state.status === 'BRUSHING' || state.status === 'BRUSH_START') {
        return sizeBrush(state, action.payload, bounds, minSize);
      }

      if (
        inDragMode &&
        (state.status === 'DRAG_START' || state.status === 'DRAGGING')
      ) {
        return moveBrush(action.payload, state, bounds);
      }

      return state;

    case 'MOUSE_UP':
      const isActiveBrush =
        state.status === 'BRUSHING' || state.status === 'BRUSH_START';
      const isActiveDrag =
        inDragMode &&
        (state.status === 'DRAGGING' || state.status === 'DRAG_START');

      if (isActiveBrush || isActiveDrag) {
        return closeBrush(state);
      }

      return state;

    case 'MOUSE_LEAVE':
      if (state.status === 'BRUSHING' || state.status === 'BRUSH_START') {
        return closeBrush(state);
      }

      if (
        inDragMode &&
        (state.status === 'DRAGGING' || state.status === 'DRAG_START')
      ) {
        return { ...state, status: 'DRAG_END' as const };
      }

      return state;

    default:
      return state;
  }
}

// Kept for backward compatibility
const reducer = (
  state: Brush,
  action: Action,
  bounds?: Bounds,
  minSize: number = 0
) => brushReducer(state, action, false, bounds, minSize);

const dragReducer = (
  state: Brush,
  action: Action,
  bounds?: Bounds,
  minSize: number = 0
) => brushReducer(state, action, true, bounds, minSize);

const initialState: Brush = {
  start: [0, 0],
  current: [0, 0],
  status: 'CLOSED',
  selection: { start: [0, 0], current: [0, 0] },
};

const validateBounds = (bounds: Bounds): Bounds => {
  const { left, right, upper, lower } = bounds;

  if (
    !isFinite(left) ||
    !isFinite(right) ||
    !isFinite(upper) ||
    !isFinite(lower)
  ) {
    console.warn('useBrush: bounds must be finite numbers');
    return bounds;
  }

  const validBounds = {
    left: Math.min(left, right),
    right: Math.max(left, right),
    upper: Math.min(upper, lower),
    lower: Math.max(upper, lower),
  };

  if (
    validBounds.left === left &&
    validBounds.right === right &&
    validBounds.upper === upper &&
    validBounds.lower === lower
  ) {
    return bounds;
  }

  console.warn(
    'useBrush: bounds were reordered to ensure left < right and upper < lower'
  );
  return validBounds;
};

const useBrush = ({
  inDragMode = true,
  bounds,
  minSize = 0,
}: { inDragMode?: boolean; bounds?: Bounds; minSize?: number } = {}) => {
  // Validate bounds if provided
  const validatedBounds = bounds ? validateBounds(bounds) : undefined;

  const [state, dispatch] = React.useReducer(
    (state: Brush, action: Action) =>
      brushReducer(state, action, inDragMode, validatedBounds, minSize),
    initialState
  );
  const ref = React.useRef<SVGSVGElement | null>(null);
  const rectRef = React.useRef<SVGRectElement | null>(null);

  const onMouseDown = (e: React.MouseEvent<SVGElement>) => {
    if (!ref.current || !(ref.current instanceof SVGSVGElement)) {
      if (ref.current) {
        console.warn('useBrush: ref must be attached to an SVG element');
      }
      return;
    }

    const coords = getCoordsFromEvent(ref.current, e);
    if (!coords) return;

    const isInsideRect = rectRef.current?.contains?.(e.target as Node);

    dispatch({
      type: isInsideRect ? 'MOUSE_DOWN_INSIDE' : 'MOUSE_DOWN',
      payload: coords,
    });
  };
  const onMouseUp = React.useCallback(() => {
    // Only dispatch if there's an active brush or drag operation
    if (state.status !== 'CLOSED') {
      dispatch({ type: 'MOUSE_UP' });
    }
  }, [state.status]);
  const onMouseMove = (e: React.MouseEvent<SVGElement>) => {
    if (!ref.current || !(ref.current instanceof SVGSVGElement)) return;

    const coords = getCoordsFromEvent(ref.current, e);
    if (!coords) return;

    dispatch({ type: 'MOUSE_MOVE', payload: coords });
  };
  const onMouseLeave = () => {
    dispatch({ type: 'MOUSE_LEAVE' });
  };

  React.useEffect(() => {
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, [onMouseUp]);

  const bind = { onMouseDown, onMouseMove, onMouseLeave, ref };
  const selection = getSelection(state);
  const rect = {
    ...dimsToRect(state),
    ...(inDragMode ? {} : { pointerEvents: 'none' as const }),
  };
  return [state, rect, rectRef, bind, selection] as const;
};

export { useBrush, reducer, dragReducer, Action, Brush, inBounds };
