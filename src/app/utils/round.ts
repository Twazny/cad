import { Point, Segment } from "../geometry/models";

export function round(value: number, scale: number): number {
    if (scale > 1) {
        return Math.round(value * 10) / 10;
    } else {
        return Math.round(value);
    }
}

export function roundPoint(point: Point, scale: number): Point {
    return {
        x: round(point.x, scale),
        y: round(point.y, scale)
    }
}

export function roundSegment(segment: Segment, scale: number): Segment {
    return [
        roundPoint(segment[0], scale),
        roundPoint(segment[1], scale)
    ];
}