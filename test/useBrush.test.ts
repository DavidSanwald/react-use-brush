import { renderHook } from '@testing-library/react-hooks';

import { Action, Brush, reducer, useBrush } from '../src';

describe('the reducer', () => {
  it('switches to starting state from being closed, on mousedown action', () => {
    const initialState: Brush = {
      start: [0, 0],
      current: [0, 0],
      status: 'CLOSED',
      selection: { start: [0, 0], current: [0, 0] },
    };
    const nextState: Brush = {
      start: [1, 1],
      current: [1, 1],
      status: 'BRUSH_START',
    };

    const action: Action = {
      type: 'MOUSE_DOWN',
      payload: [1, 1],
    };
    const result = reducer(initialState, action);
    expect(result).toEqual(nextState);
  });
  it("switches to brushing status from 'BRUSH_START' status, when the mouse is moved", () => {
    const initialState: Brush = {
      start: [0, 0],
      current: [0, 0],
      status: 'BRUSH_START',
    };

    const action: Action = {
      type: 'MOUSE_MOVE',
      payload: [1, 1],
    };

    const nextState: Brush = {
      start: [0, 0],
      current: [1, 1],
      status: 'BRUSHING',
    };
    const result = reducer(initialState, action);
    expect(result).toEqual(nextState);
  });
  it('if mouse up event occures during brushing the brush closes but saves the selection', () => {
    const initialState: Brush = {
      start: [1, 1],
      current: [2, 2],
      status: 'BRUSHING',
    };

    const action: Action = {
      type: 'MOUSE_UP',
    };

    const nextState: Brush = {
      start: [0, 0],
      current: [0, 0],
      status: 'CLOSED',
      selection: { start: [1, 1], current: [2, 2] },
    };
    const result = reducer(initialState, action);
    expect(result).toEqual(nextState);
  });
});

describe('it', () => {
  it('renders without crashing', () => {
    const { result } = renderHook(() => useBrush());
    expect(result).toBeDefined();
  });
});
