import React from 'react';

type Action =
  | {
      type: 'MOUSE_DOWN';
      payload: Position;
    }
  | { type: 'MOUSE_MOVE'; payload: Position }
  | {
      type: 'MOUSE_UP';
    }
  | {
      type: 'MOUSE_LEAVE';
      payload: Position;
    };

type Position = {
  x: number;
  y: number;
};

type Status = 'IDLE' | 'BRUSHING';

type State = {
  startPosition: Position;
  currentPosition: Position;
  status: Status;
};

type YDirection = 'UP' | 'DOWN';
type XDirection = 'LEFT' | 'RIGHT';

function getCoordsFromEvent(
  node: SVGSVGElement,
  event: React.MouseEvent
): Position | null {
  if (!node) return null;
  const svg = node.ownerSVGElement || node;
  if (svg.createSVGPoint) {
    let point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    point = point.matrixTransform(node.getScreenCTM()!.inverse());
    return {
      x: point.x,
      y: point.y,
    };
  }
  const rect = node.getBoundingClientRect();
  return {
    x: event.clientX - rect.left - node.clientLeft,
    y: event.clientY - rect.top - node.clientTop,
  };
}

const isInside = (x: number, y: number, width: number, height: number) => (
  xPos: number,
  yPos: number
) => {
  const xInside = x < xPos && xPos < x + width;
  const yInside = y < yPos && yPos < y + height;
  return xInside && yInside;
};

function calculateRectangle(start: Position, current: Position) {
  const { x: startX, y: startY } = start;
  const { x: currentX, y: currentY } = current;
  const yDirection: YDirection = startY - currentY <= 0 ? 'DOWN' : 'UP';
  const xDirection: XDirection = startX - currentX <= 0 ? 'RIGHT' : 'LEFT';
  return {
    x: xDirection === 'RIGHT' ? startX : currentX,
    y: yDirection === 'DOWN' ? startY : currentY,
    width: Math.abs(startX - currentX),
    height: Math.abs(startY - currentY),
    pointerEvents: 'none',
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'MOUSE_DOWN':
      return {
        ...state,
        startPosition: action.payload,
        status: 'BRUSHING',
      };
    case 'MOUSE_UP':
      return { ...state, status: 'IDLE' };
    case 'MOUSE_LEAVE':
      return state;
    case 'MOUSE_MOVE':
      return { ...state, currentPosition: action.payload };
    default:
      return state;
  }
}

const initialState: State = {
  startPosition: { x: 0, y: 0 },
  currentPosition: { x: 0, y: 0 },
  status: 'IDLE',
};

const useBrush = () => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const ref = React.useRef<null | SVGElement>();

  const onMouseDown = (e: React.MouseEvent<SVGElement>) => {
    const coords = getCoordsFromEvent(ref.current as SVGSVGElement, e);
    dispatch({ type: 'MOUSE_DOWN', payload: coords! });
  };
  const onMouseUp = () => {
    dispatch({ type: 'MOUSE_UP' });
  };
  const onMouseMove = (e: React.MouseEvent<SVGElement>) => {
    const coords = getCoordsFromEvent(ref.current as SVGSVGElement, e);
    dispatch({ type: 'MOUSE_MOVE', payload: coords! });
  };
  const onMouseLeave = ({ clientX, clientY }: React.MouseEvent<SVGElement>) => {
    dispatch({ type: 'MOUSE_LEAVE', payload: { x: clientX, y: clientY } });
  };

  React.useEffect(() => {
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  });

  const bind = { onMouseDown, onMouseMove, onMouseLeave, ref };
  const rect = calculateRectangle(state.startPosition, state.currentPosition);
  const isInsideCB = React.useCallback(
    isInside(rect.x, rect.y, rect.width, rect.height),
    [rect.height, rect.width, rect.x, rect.y]
  );
  return [state, rect, bind, isInsideCB] as const;
};

export { useBrush };
