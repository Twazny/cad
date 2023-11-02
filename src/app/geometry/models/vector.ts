import { Point } from './point';

export type Vector = Point;

export function distance(point1: Point, point2: Point): Vector {
    return {
        x: point1.x - point2.x,
        y: point1.y - point2.y
    }
}
