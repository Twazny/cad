import { Vector } from "./vector";

export interface Point {
    x: number;
    y: number;
}

export function scalePoint(point: Point, scale: number): Point {
    return {
        x: point.x * scale,
        y: point.y * scale
    };
}

export function translatePoint(point: Point, vector: Vector): Point {
    return {
        x: point.x + vector.x,
        y: point.y + vector.y
    };
}

