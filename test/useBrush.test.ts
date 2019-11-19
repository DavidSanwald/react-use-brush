import { renderHook } from '@testing-library/react-hooks';

import { Action, Brush, reducer, useBrush } from '../src';

describe('the reducer', () => {
  const initialState: Brush = {
    start: [0, 0],
    current: [0, 0],
    status: 'CLOSED',
    selection: { status: 'empty' },
  };

  const action: Action = {
    type: 'MOUSE_DOWN',
    payload: [1, 1],
  };
  const result = reducer(initialState, action);
  expect(result.status).toEqual('BRUSH_START');
});

describe('it', () => {
  it('renders without crashing', () => {
    const { result } = renderHook(() => useBrush());
    expect(result).toBeDefined();
  });
});
