import { Injectable, inject } from "@angular/core";
import { Point, scalePoint } from "../../geometry/models/point";
import { BehaviorSubject, Observable, Subject, combineLatest, map, scan, startWith } from "rxjs";
import { ObjectsService } from "./objects.service";
import { Rect } from "../../geometry/models/rect";
import { PositionedRect } from "../../geometry/models/positioned-rect";
import { Segment, scaleSegment, translateSegment } from "../../geometry/models/segment";
import { containsPoint } from '../../geometry/models/positioned-rect';
import { rxState } from '@rx-angular/state';
import { WorkspaceState } from "../models/workspace-state";
import { Vector } from "src/app/geometry/models/vector";

@Injectable()
export class ViewportService {

  private readonly objectService: ObjectsService = inject(ObjectsService);

  private readonly state = rxState<WorkspaceState>(({ set, connect }) => {
    set({ 
      zoom: ViewportService.INITIAL_ZOOM,
      lastPosition: ViewportService.INITIAL_POSITION,
      position: ViewportService.INITIAL_POSITION,
      objects: []
    });
    connect('objects', this.objectService.segments$);
  });

  private static readonly INITIAL_POSITION: Point = {x: 0, y: 0};
  private static readonly INITIAL_ZOOM: number = 1;
  private static readonly MAKS_ZOOM: number = 10;
  private static readonly MIN_ZOOM: number = 0.1; 

  public zoom$: Observable<number> = this.state.select('zoom');
  public position$: Observable<Point> = this.state.select('position');

  public yAxis$: Observable<number> = this.state.select(
    ['position', 'zoom'],
    ({position, zoom}) => {
    return position.y * zoom;
  })

  public xAxis$: Observable<number> = this.state.select(
    ['position', 'zoom'],
    ({position, zoom}) => {
    return position.x * zoom;
  })

  public xGridLines$: Observable<number[]> = this.state.select(
    ['position', 'zoom', 'viewportSize'],
    ({position, zoom, viewportSize}) => {
      const leftLinesCount = Math.floor(position.x / 10);
      const rightLinesCount = Math.floor((viewportSize.width - position.x) / 10);
      const total = leftLinesCount + rightLinesCount;
      
      const getStep = (viewportWidth: number): number => {
        let step = 10;
        let noOfLines = viewportWidth; 
        do {
          console.log('fff')
          noOfLines = Math.floor(viewportWidth / step);
          step *= 10;
        } while (noOfLines > 20);
        return step;
      }

      console.log(getStep(viewportSize.width))

      const a = [
        (position.x + 20) * zoom,
        (position.x + 10) * zoom,
        // position.x * zoom,
        (position.x - 10) * zoom,
        (position.x - 20) * zoom
      ]
      console.log(viewportSize, a)
      return a;
    } 
  )

  public viewportObjects$: Observable<Segment[]> = this.state.select(
    ['zoom', 'position', 'viewportSize', 'objects'],
    ({ zoom, position, viewportSize, objects }) => {
      const visibleRect: PositionedRect = {
        point: {x: 0, y: 0},
        width: viewportSize.width,
        height: viewportSize.height
      }

      let visible: Segment[] = [];
      let notVisible: Segment[] = [];
      let intersected: Segment[] = [];

      objects.map((segment: Segment) => {
        return translateSegment(scaleSegment(segment, zoom), position, zoom);
      }).forEach((segment: Segment) => {
        const firstPoint = containsPoint(visibleRect, segment[0]);
        const secondPoint = containsPoint(visibleRect, segment[1]);


        // TODO: fix case when both point are outside but center should be visible
        // calculate 2D function ax + b for segments
        if (firstPoint && secondPoint) {
          visible.push(segment);
          return;
        } else if (firstPoint || secondPoint) {
          intersected.push(segment);
          return;
        } else {
          notVisible.push(segment);
        }
      });

      // console.log(notVisible);
      // TODO: cut intersected;
      return visible.concat(intersected).concat(notVisible);
    }
  );

  public connectDrag(drag$: Observable<Vector>): void {
    this.state.connect('position', drag$, ({lastPosition, zoom}, vector) => {
      return {x: lastPosition.x - vector.x * -1 / zoom, y: lastPosition.y - vector.y * -1 / zoom};
    });
  }

  public connectDragEnd(dragEnd$: Observable<void>): void {
    this.state.connect('lastPosition', dragEnd$, ({position}) => position);
  }

  public connectResize(viewportSize$: Observable<Rect>): void {
    this.state.connect('viewportSize', viewportSize$);
  }

  public connectWheel(wheel$: Observable<WheelEvent>): void {
    this.state.connect(wheel$, ({ zoom, position }, event) => {
      event.preventDefault();
      const { deltaY, clientX, clientY } = event;

      const factor: number = this.getZoomChange(zoom, deltaY);
      const newZoom = Math.min(Math.max(zoom + factor, ViewportService.MIN_ZOOM), ViewportService.MAKS_ZOOM);

      const wheelPosition = {
        x: position.x - clientX / zoom,
        y: position.y - clientY / zoom,
      }

      const newWheelPosition = {
        x: position.x - clientX / newZoom,
        y: position.y - clientY / newZoom,
      }

      const diff: Vector = {
        x: newWheelPosition.x - wheelPosition.x,
        y: newWheelPosition.y - wheelPosition.y
      }

      return {
        zoom: newZoom,
        position: {
          x: position.x - diff.x,
          y: position.y - diff.y
        },
        lastPosition: {
          x: position.x - diff.x,
          y: position.y - diff.y
        }
      }
    })
  }

  private getZoomChange(currentZoom: number, changeDirection: number): number {
    if (currentZoom === 1) {
      return changeDirection > 0 ? 1 : -0.1;
    } else if (currentZoom < 1) {
      return changeDirection > 0 ? 0.1 : -0.1;
    } else {
      return changeDirection > 0 ? 1 : -1;
    }
  }
}
