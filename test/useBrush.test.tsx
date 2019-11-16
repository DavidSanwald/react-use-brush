import { renderHook } from '@testing-library/react-hooks';

import { useBrush } from '../src';

describe('it', () => {
  it('renders without crashing', () => {
    const { result } = renderHook(() => useBrush());
    expect(result).toBeDefined();
  });
});
