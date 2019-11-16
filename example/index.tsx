import 'react-app-polyfill/ie11';

import { scaleLinear } from 'd3-scale';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { useBrush } from '../.';
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
  const [state, rect, bind, isInsideCb] = useBrush();

  return (
    <svg {...bind} width={width} height={height}>
      {state.status === 'BRUSHING' && (
        <rect {...rect} fill="none" stroke="black" />
      )}
      {data.map(({ x, y, name }) => (
        <circle cx={xScale(x)} cy={yScale(y)} r="5" fill="red" key={name} />
      ))}
    </svg>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
