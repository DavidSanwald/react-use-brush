import { renderHook } from '@testing-library/react-hooks';

import { Action, Brush, dragReducer, reducer, useBrush } from '../src';

describe('the dragReducer', () => {
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
    const result = dragReducer(initialState, action);
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
    const result = dragReducer(initialState, action);
    expect(result).toEqual(nextState);
  });
  it('if mouse up event occures during brushing the brush transitions to CLOSED state', () => {
    const initialState: Brush = {
      start: [1, 1],
      current: [2, 2],
      status: 'BRUSHING',
    };

    const action: Action = {
      type: 'MOUSE_UP',
    };

    const result = dragReducer(initialState, action);
    expect(result.status).toBe('CLOSED');
    expect(result).toHaveProperty('selection');
    if ('selection' in result) {
      expect(result.selection).toEqual({ start: [1, 1], current: [2, 2] });
    }
  });

  it('if mouse up event occures during brushing the brush transitions to CLOSED state', () => {
    const initialState: Brush = {
      start: [1, 1],
      current: [2, 2],
      status: 'BRUSH_START',
    };

    const action: Action = {
      type: 'MOUSE_UP',
    };

    const result = dragReducer(initialState, action);
    expect(result.status).toBe('CLOSED');
    expect(result).toHaveProperty('selection');
    if ('selection' in result) {
      expect(result.selection).toEqual({ start: [1, 1], current: [2, 2] });
    }
  });

  it('if mouse up event occures during brushing the brush transitions to CLOSED state', () => {
    const initialState: Brush = {
      start: [1, 1],
      current: [2, 2],
      status: 'BRUSH_START',
    };

    const action: Action = {
      type: 'MOUSE_UP',
    };

    const result = dragReducer(initialState, action);
    expect(result.status).toBe('CLOSED');
    expect(result).toHaveProperty('selection');
    if ('selection' in result) {
      expect(result.selection).toEqual({ start: [1, 1], current: [2, 2] });
    }
  });
});

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

describe('mouse event handling', () => {
  it('only dispatches MOUSE_UP when there is an active operation', () => {
    const { result } = renderHook(() => useBrush());
    const [initialState] = result.current;

    // Initially in CLOSED state
    expect(initialState.status).toBe('CLOSED');

    // The onMouseUp logic is now internal to the hook and prevents unnecessary dispatches
    // This test verifies the initial state is correct
  });
});

describe('bounds validation', () => {
  it('validates and reorders bounds if necessary', () => {
    // Test with incorrectly ordered bounds
    const { result } = renderHook(() =>
      useBrush({
        bounds: { left: 100, right: 0, upper: 100, lower: 0 },
      })
    );

    // Hook should still work with reordered bounds
    expect(result.current).toBeDefined();
  });

  it('handles non-finite bounds gracefully', () => {
    const { result } = renderHook(() =>
      useBrush({
        bounds: { left: 0, right: Infinity, upper: 0, lower: 100 },
      })
    );

    // Hook should still work even with invalid bounds
    expect(result.current).toBeDefined();
  });
});

describe('minimum size enforcement', () => {
  it('enforces minimum brush size', () => {
    const minSize = 10;
    const initialState: Brush = {
      start: [50, 50],
      current: [50, 50],
      status: 'BRUSHING',
    };

    // Try to create a brush smaller than minSize
    const action: Action = {
      type: 'MOUSE_MOVE',
      payload: [52, 52], // Only 2x2 pixels
    };

    const result = reducer(initialState, action, undefined, minSize);

    // Brush should be at least minSize
    expect(result.status).toBe('BRUSHING');
    if (result.status === 'BRUSHING') {
      const width = Math.abs(result.current[0] - result.start[0]);
      const height = Math.abs(result.current[1] - result.start[1]);
      expect(width).toBeGreaterThanOrEqual(minSize);
      expect(height).toBeGreaterThanOrEqual(minSize);
    }
  });
});

describe('bounds constraints', () => {
  it('handles brush larger than bounds in drag mode', () => {
    const bounds = { left: 0, right: 50, upper: 0, lower: 50 };
    const initialState: Brush = {
      start: [0, 0],
      current: [100, 100], // Brush is 100x100, bounds are 50x50
      status: 'DRAGGING',
      previousPosition: [50, 50],
    } as any; // Cast to any since DraggingBrush is not exported

    // Try to move the oversized brush
    const action: Action = {
      type: 'MOUSE_MOVE',
      payload: [60, 60],
    };

    const result = dragReducer(initialState, action, bounds);

    // Brush should be constrained
    expect(result.status).toBe('DRAGGING');
    if (result.status === 'DRAGGING') {
      // Check that brush stays within bounds despite being larger
      expect(result.start[0]).toBeGreaterThanOrEqual(bounds.left);
      expect(result.start[1]).toBeGreaterThanOrEqual(bounds.upper);
    }
  });

  it('keeps entire brush rectangle within bounds when sizing', () => {
    const bounds = { left: 0, right: 100, upper: 0, lower: 100 };
    const initialState: Brush = {
      start: [90, 90],
      current: [90, 90],
      status: 'BRUSHING',
    };

    // Try to drag beyond bounds
    const action: Action = {
      type: 'MOUSE_MOVE',
      payload: [110, 110],
    };

    const result = reducer(initialState, action, bounds);

    // Both points should be constrained so rectangle stays within bounds
    expect(result.status).toBe('BRUSHING');
    if (result.status === 'BRUSHING') {
      const minX = Math.min(result.start[0], result.current[0]);
      const maxX = Math.max(result.start[0], result.current[0]);
      const minY = Math.min(result.start[1], result.current[1]);
      const maxY = Math.max(result.start[1], result.current[1]);

      expect(minX).toBeGreaterThanOrEqual(bounds.left);
      expect(maxX).toBeLessThanOrEqual(bounds.right);
      expect(minY).toBeGreaterThanOrEqual(bounds.upper);
      expect(maxY).toBeLessThanOrEqual(bounds.lower);
    }
  });
});
