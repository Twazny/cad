import { Point } from './point';
import { Segment } from './segment';

export type Vector = Point;

export function getVector(point1: Point, point2: Point): Vector {
    return {
        x: point1.x - point2.x,
        y: point1.y - point2.y
    }
}

export function getVectorForSegment(segment: Segment): Vector {
    return getVector(segment[0], segment[1]);
}

export function getVectorProduct(vector1: Vector, vector2: Vector): number {
    return vector1.x * vector2.y - vector2.x * vector1.y;
}
