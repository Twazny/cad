import { Point, scalePoint, translatePoint } from './point';
import { PositionedRect } from './positioned-rect';
import { getVector, getVectorForSegment, getVectorProduct } from './vector';

export type Segment = [Point, Point];

export function scaleSegment(segment: Segment, scale: number): Segment {
  return [scalePoint(segment[0], scale), scalePoint(segment[1], scale)];
}

export function translateSegment(segment: Segment, vector: Point): Segment {
  return [
    translatePoint(segment[0], vector),
    translatePoint(segment[1], vector),
  ];
}

export function lowerRightAnglePoint(segment: Segment): Point {
  return {
    x: Math.min(segment[0].x, segment[1].x),
    y: Math.min(segment[0].y, segment[1].y),
  };
}

export function higherRightAnglePoint(segment: Segment): Point {
  return {
    x: Math.max(segment[0].x, segment[1].x),
    y: Math.max(segment[0].y, segment[1].y),
  };
}

export function getBoundingSegments(
  segment: Segment
): [Segment, Segment, Segment, Segment] {
  const { x: x1, y: y1 } = segment[0];
  const { x: x2, y: y2 } = segment[1];
  return [
    [
      { x: x1, y: y1 },
      { x: x2, y: y1 },
    ],
    [
      { x: x2, y: y1 },
      { x: x2, y: y2 },
    ],
    [
      { x: x2, y: y2 },
      { x: x1, y: y2 },
    ],
    [
      { x: x1, y: y2 },
      { x: x1, y: y1 },
    ],
  ];
}

export function segmentToRect(segment: Segment): PositionedRect {
  const lrap = lowerRightAnglePoint(segment);
  const hrap = higherRightAnglePoint(segment);
  return {
    point: lrap,
    width: hrap.x - lrap.x,
    height: hrap.y - lrap.y,
  };
}

export function getSegmentLength(segment: Segment): number {
  const [p1, p2] = segment;
  const a = p1.x - p2.x;
  const b = p1.y - p2.y;
  return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
}

export function areSegmentsIntersecting(
  segmentAB: Segment,
  segmentCD: Segment
): boolean {
  const vectorAB = getVectorForSegment(segmentAB);
  const vectorCD = getVectorForSegment(segmentCD);
  const vectorAC = getVector(segmentAB[0], segmentCD[0]);
  const vectorAD = getVector(segmentAB[0], segmentCD[1]);
  const vectorCA = getVector(segmentCD[0], segmentAB[0]);
  const vectorCB = getVector(segmentCD[0], segmentAB[1]);

  const productABAC = getVectorProduct(vectorAB, vectorAC);
  const productABAD = getVectorProduct(vectorAB, vectorAD);
  const productCDCA = getVectorProduct(vectorCD, vectorCA);
  const productCDCB = getVectorProduct(vectorCD, vectorCB);

  if (productABAC * productABAD < 0 && productCDCA * productCDCB < 0) {
    return true;
  }
  if (productABAC === 0 && isPointOnSegment(segmentAB, segmentCD[0])) {
    return true;
  }
  if (productABAD === 0 && isPointOnSegment(segmentAB, segmentCD[1])) {
    return true;
  }
  if (productCDCA === 0 && isPointOnSegment(segmentCD, segmentAB[0])) {
    return true;
  }
  if (productCDCB === 0 && isPointOnSegment(segmentCD, segmentAB[1])) {
    return true;
  }

  return false;
}

function isPointOnSegment(segment: Segment, point: Point): boolean {
  return (
    Math.min(segment[0].x, segment[1].x) <= point.x &&
    point.x <= Math.max(segment[0].x, segment[1].x) &&
    Math.min(segment[0].y, segment[1].y) <= point.y &&
    point.y <= Math.max(segment[0].y, segment[1].y)
  );
}
