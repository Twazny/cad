import { Point, scalePoint, translatePoint } from "./point";
import { PositionedRect } from "./positioned-rect";

export type Segment = [Point, Point];

export function scaleSegment(segment: Segment, scale: number): Segment {
    return [
        scalePoint(segment[0], scale),
        scalePoint(segment[1], scale)
    ]
};

export function translateSegment(segment: Segment, vector: Point): Segment {
    return [
        translatePoint(segment[0], vector),
        translatePoint(segment[1], vector)
    ]
}

export function lowerRightAnglePoint(segment: Segment): Point {
    return {
        x: Math.min(segment[0].x, segment[1].x),
        y: Math.min(segment[0].y, segment[1].y)
    };
}

export function higherRightAnglePoint(segment: Segment): Point {
    return {
        x: Math.max(segment[0].x, segment[1].x),
        y: Math.max(segment[0].y, segment[1].y)
    };
}

export function segmentToRect(segment: Segment): PositionedRect {
    const lrap = lowerRightAnglePoint(segment);
    const hrap = higherRightAnglePoint(segment);
    return {
        point: lrap,
        width: hrap.x - lrap.x,
        height: hrap.y - lrap.y
    };
}

export function getSegmentLength(segment: Segment): number {
    const [p1, p2] = segment;
    const a = p1.x - p2.x;
    const b = p1.y - p2.y;
    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
}