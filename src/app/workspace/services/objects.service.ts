import { Injectable } from "@angular/core";
import { Segment, segmentToRect } from "../../geometry/models/segment";
import { BehaviorSubject, Observable, map } from "rxjs";
import { Point } from "../../geometry/models/point";
import { PositionedRect } from "../../geometry/models/positioned-rect";

@Injectable({
    providedIn: 'root'
})
export class ObjectsService {
    
    private _segments$ = new BehaviorSubject<Segment[]>([
        [{x: 10, y: 19}, {x: 68, y: 44}],
        [{x: 68, y: 44}, {x: 80, y: 122}],
        [{x: 80, y: 122}, {x: 10, y: 19}],
        [{x: -340, y: -133}, {x: 400, y: -150}],
        [{x: -160, y: 50}, {x: -110, y: 50}],
        [{x: -160, y: 50}, {x: -160, y: 96}],
        [{x: -160, y: 96}, {x: -110, y: 96}],
        [{x: -110, y: 96}, {x: -110, y: 50}],
    ]);

    public segments$ = this._segments$.asObservable();

    public points$ = this._segments$.pipe(
        map((segments) => segments.reduce((acc, segments) => {
            acc.push(...segments);
            return acc;
        }, [] as Point[]))
    );

    public boundingRect$: Observable<PositionedRect> = this.points$.pipe(
        map((points) => points.reduce((acc, point) => {
            const {x: lowestX, y: lowestY } = acc[0];
            const {x: highestX, y: highestY } = acc[1];
            const {x: currentX, y: currentY } = point;
            acc[0] = {
                x: Math.min(lowestX, currentX),
                y: Math.min(lowestY, currentY)
            };
            acc[1] = {
                x: Math.max(highestX, currentX),
                y: Math.max(highestY, currentY)
            };
            return acc;
        }, [{x: 0, y: 0}, {x: 0, y:0}] as Segment)),
        map((segment) => segmentToRect(segment)),
    );
}
