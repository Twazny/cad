import { Injectable, inject } from "@angular/core";
import { Point, invertPoint, isSamePoint, scalePoint, translatePoint } from "../../geometry/models/point";
import { BehaviorSubject, Observable, Subject, combineLatest, map, scan, startWith } from "rxjs";
import { ObjectsService } from "./objects.service";
import { Rect } from "../../geometry/models/rect";
import { PositionedRect } from "../../geometry/models/positioned-rect";
import { Segment, scaleSegment, translateSegment } from "../../geometry/models/segment";
import { containsPoint } from '../../geometry/models/positioned-rect';
import { rxState } from '@rx-angular/state';
import { WorkspaceState } from "../models/workspace-state";
import { Vector, distance } from "src/app/geometry/models/vector";

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

  private static readonly INITIAL_POSITION: Point = { x: 0, y: 0 };
  private static readonly INITIAL_ZOOM: number = 1;
  private static readonly MAKS_ZOOM: number = 10;
  private static readonly MIN_ZOOM: number = 0.1;

  public zoom$: Observable<number> = this.state.select('zoom');
  public position$: Observable<Point> = this.state.select('position');

  public draftSegment$: Observable<Segment | null> = this.state.select(
    ['position', 'zoom', 'draftSegment'],
    ({ position, zoom, draftSegment }) => {
      const translateVector = invertPoint(position);
      return draftSegment ? scaleSegment(translateSegment(draftSegment, translateVector), zoom) : null;
    }
  );

  public mouseTooltip$: Observable<{
    label: string,
    screenMousePostion: Point
  }> = this.state.select(
    ['position', 'mouseScreenPosition', 'zoom'],
    ({ position, mouseScreenPosition, zoom }) => {
      const { x, y } = this.mouseScreenToReal(position, mouseScreenPosition, zoom);
      return {
        label: `(${x}, ${y})`,
        screenMousePostion: mouseScreenPosition
      };
    }
  );

  public yAxis$: Observable<number> = this.state.select(
    ['position', 'zoom'],
    ({ position, zoom }) => {
      return -position.y * zoom;
    }
  );

  public xAxis$: Observable<number> = this.state.select(
    ['position', 'zoom'],
    ({ position, zoom }) => {
      return -position.x * zoom;
    }
  );

  public gridLines$: Observable<{
    vertical: number[],
    horizontal: number[]
  }> = this.state.select(
    ['position', 'zoom', 'viewportSize'],
    ({ position, zoom, viewportSize }) => {

      const getStep = (viewportWidth: number, zoom: number): number => {
        let step = 1;
        let noOfLines = viewportWidth;
        do {
          step *= 10;
          noOfLines = Math.floor(viewportWidth / zoom / step);
        } while (noOfLines > 50);
        return step;
      }

      const step: number = getStep(viewportSize.width, zoom);
      const verticalLinesNo = Math.ceil(viewportSize.width / zoom / step);
      const horizontalLinesNo = Math.ceil(viewportSize.height / zoom / step);

      const getFirstLinePos = (pos: number): number => {
        if (pos < 0) {
          return pos - (pos % step);
        } else if (pos > 0) {
          return pos + (step - pos % step)
        } else {
          return step;
        }
      };

      const firstVerticalLine = getFirstLinePos(position.x);
      const firstHorizontalLine = getFirstLinePos(position.y);

      const getLines = (linesCount: number, firstLinePos: number, pos: number, step: number) => {
        return Array(linesCount).fill(null).reduce((acc, _, i) => {
          const linePos = (firstLinePos + step * i) - pos;
          if (linePos !== pos * -1) {
            acc.push(linePos * zoom);
          }
          return acc;
        }, []);
      };

      return {
        vertical: getLines(verticalLinesNo, firstVerticalLine, position.x, step),
        horizontal: getLines(horizontalLinesNo, firstHorizontalLine, position.y, step),
      }
    }
  );

  public viewportObjects$: Observable<Segment[]> = this.state.select(
    ['zoom', 'position', 'viewportSize', 'objects'],
    ({ zoom, position, viewportSize, objects }) => {
      const visibleRect: PositionedRect = {
        point: { x: 0, y: 0 },
        width: viewportSize.width,
        height: viewportSize.height
      };

      const translateVector = invertPoint(position);

      let visible: Segment[] = [];
      let notVisible: Segment[] = [];
      let intersected: Segment[] = [];

      objects.map((segment: Segment) => {
        return scaleSegment(translateSegment(segment, translateVector), zoom);
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
    this.state.connect('position', drag$, ({ lastPosition, zoom }, vector) => {
      return { x: (lastPosition.x + vector.x / zoom), y: (lastPosition.y + vector.y / zoom) };
    });
  }

  public connectResize(viewportSize$: Observable<Rect>): void {
    this.state.connect('viewportSize', viewportSize$);
  }

  public connectMousemove(mouseMove$: Observable<MouseEvent>): void {
    this.state.connect(
      mouseMove$.pipe(map(({ clientX, clientY }) => ({ x: clientX, y: clientY }))),
      ({ draftSegment, position, zoom }, mouseScreenPosition) => {
        const mouseReal = this.mouseScreenToReal(position, mouseScreenPosition, zoom)
        return ({
          mouseScreenPosition,
          draftSegment: draftSegment ? [draftSegment[0], mouseReal] : null
        })
      }
    );
  }

  public connectClick(mouseClick$: Observable<MouseEvent>): void {
    this.state.connect(mouseClick$, ({ draftSegment, mouseScreenPosition, position, lastPosition, zoom }) => {
      if (isSamePoint(position, lastPosition)) {
        if (!draftSegment) {
          const mouseReal = this.mouseScreenToReal(position, mouseScreenPosition, zoom);
          return { draftSegment: [mouseReal, mouseReal] }
        } else {
          this.objectService.addSegment(draftSegment);
          return { draftSegment: null };
        }
      } else {
        return { lastPosition: position };
      }
    });
  }

  public connectZoom(zoomChange$: Observable<number>): void {
    this.state.connect(zoomChange$, ({ zoom, position, viewportSize }, changeDirection) => {
      const mouseScreenPosition: Point = { x: viewportSize.width / 2, y: viewportSize.height / 2 };
      return this.handleZoomChange(zoom, position, mouseScreenPosition, changeDirection);
    })
  }

  public connectWheel(wheel$: Observable<WheelEvent>): void {
    this.state.connect(wheel$, ({ zoom, position }, event) => {
      event.preventDefault();
      const { deltaY, clientX, clientY } = event;
      const mouseScreenPosition: Point = { x: clientX, y: clientY };
      return this.handleZoomChange(zoom, position, mouseScreenPosition, deltaY);
    })
  }

  private handleZoomChange(zoom: number, position: Point, mouseScreenPosition: Point, changeDirection: number): Pick<WorkspaceState, 'zoom' | 'position' | 'lastPosition'> {
    const factor: number = this.getZoomChange(zoom, changeDirection);
    const newZoom = Math.min(Math.max(Math.round((zoom + factor) * 100) / 100, ViewportService.MIN_ZOOM), ViewportService.MAKS_ZOOM);

    const wheelPosition = this.mouseScreenToReal(position, mouseScreenPosition, zoom);
    const newWheelPosition = this.mouseScreenToReal(position, mouseScreenPosition, newZoom);
    const diff: Vector = distance(wheelPosition, newWheelPosition);
    const newPosition = translatePoint(position, diff);

    return {
      zoom: newZoom,
      position: newPosition,
      lastPosition: newPosition
    }
  }

  private mouseScreenToReal(realPosition: Point, mouseScreenPosition: Point, scale: number): Point {
    return {
      x: realPosition.x + mouseScreenPosition.x / scale,
      y: realPosition.y + mouseScreenPosition.y / scale,
    }
  }

  private getZoomChange(currentZoom: number, changeDirection: number): number {
    const zoomOutFactor: number = 0.05;
    const zoomInFactor: number = 0.5;
    if (currentZoom === 1) {
      return changeDirection > 0 ? zoomInFactor : zoomOutFactor * -1;
    } else if (currentZoom < 1) {
      return changeDirection > 0 ? zoomOutFactor : zoomOutFactor * -1;
    } else {
      return changeDirection > 0 ? zoomInFactor : zoomInFactor * -1;
    }
  }
}
