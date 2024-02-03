import { Segment } from './segment';

export interface Line {
  a: number;
  b: number;
}

export function slope(segment: Segment): number {
  const { x: x1, y: y1 } = segment[0];
  const { x: x2, y: y2 } = segment[1];
  return (y2 - y1) / (x2 - x1);
}

export function slopeToAngle(slope: number): number {
  return (Math.atan(slope) * 180) / Math.PI;
}

export function lineEquation(segment: Segment): Line {
  const a = slope(segment);
  const b = segment[0].y - a * segment[0].x;
  return { a, b };
}
