import React from 'react';
import { animated, useSpring } from 'react-spring';

type Props = {
  x: number;
  y: number;
  r: number;
} & React.SVGAttributes<SVGCircleElement>;

const Bubble = React.memo(({ x, y, r, ...props }: Props) => {
  const [animationProps, set] = useSpring(() => ({ r }));
  set({ r });

  return <animated.circle cx={x} cy={y} {...animationProps} fill="red" />;
});

export { Bubble };
