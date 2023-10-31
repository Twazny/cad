import { Point } from "./point";
import { Rect } from "./rect";

export interface PositionedRect extends Rect {
    point: Point;
}


export function containsPoint(rect: PositionedRect, point: Point): boolean {
    const firstRectPoint = rect.point;
    const secondRectPoint = {
        x: firstRectPoint.x + rect.width,
        y: firstRectPoint.y + rect.height
    }
    const xContained = point.x > firstRectPoint.x && point.x < secondRectPoint.x;
    const yContained = point.y > firstRectPoint.y && point.y < secondRectPoint.y; 
    return xContained && yContained;
}