import 'react-app-polyfill/ie11';

import { scaleLinear, scaleSqrt } from 'd3-scale';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { inBounds, useBrush } from '../.';
import { Bubble } from './Bubble';
import { bubbleData as data } from './data';

const size = { width: 900, height: 600 };
function extent(xs: number[]): [number, number] {
  const minimum = xs.reduce((acc, curr) => Math.min(acc, curr), Infinity);
  const maximum = xs.reduce((acc, curr) => Math.max(acc, curr), -Infinity);
  return [minimum, maximum];
}

const App = () => {
  const { width, height } = size;
  const xScale = scaleLinear()
    .range([0, width])
    .domain(extent(data.map(d => d.x)));
  const yScale = scaleLinear()
    .range([height, 0])
    .domain(extent(data.map(d => d.y)));
  const rScale = scaleSqrt()
    .range([5, 40])
    .domain(extent(data.map(d => d.z)));

  const [state, rect, rectRef, bind, selection] = useBrush({ dragMode: true });

  return (
    <>
      <svg {...bind} width={width} height={height}>
        <rect
          {...rect}
          ref={rectRef}
          fill="none"
          stroke="black"
          pointerEvents="all"
        />
        {data.map(({ x, y, z, name }) => {
          const cx = xScale(x);
          const cy = yScale(y);
          const r = rScale(z);
          const inside = inBounds(selection)([cx, cy]);
          return <Bubble x={cx} y={cy} r={r * (inside ? 2 : 1)} key={name} />;
        })}
      </svg>
      <pre>{JSON.stringify(state)}</pre>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
