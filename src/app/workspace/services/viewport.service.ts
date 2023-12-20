import { Injectable, inject } from "@angular/core";
import { Point, invertPoint, isSamePoint, translatePoint } from "../../geometry/models/point";
import { Observable, map } from "rxjs";
import { Rect } from "../../geometry/models/rect";
import { PositionedRect } from "../../geometry/models/positioned-rect";
import { Segment, scaleSegment, segmentToRect, translateSegment } from "../../geometry/models/segment";
import { rxState } from '@rx-angular/state';
import { WorkspaceState } from "../models/workspace-state";
import { Vector, getVector } from "src/app/geometry/models/vector";
import { Store } from "@ngrx/store";
import { selectAllObjects } from "../store/object.selectors";
import { v4 as uuidv4 } from 'uuid';
import * as ObjectActions from '../store/object.actions';
import { Command } from "../models/command.enum";
import { WorkspaceObject } from "../models/workspace-object";

@Injectable()
export class ViewportService {

  private readonly store: Store = inject(Store);

  private readonly state = rxState<WorkspaceState>(({ set, connect }) => {
    set({
      zoom: ViewportService.INITIAL_ZOOM,
      lastPosition: ViewportService.INITIAL_POSITION,
      position: ViewportService.INITIAL_POSITION,
      objects: [],
      mainCommand: ViewportService.INITIAL_COMMAND
    });
    connect('objects', this.store.select(selectAllObjects));
  });

  private static readonly INITIAL_COMMAND: Command = Command.SELECT;
  private static readonly INITIAL_POSITION: Point = { x: 0, y: 0 };
  private static readonly INITIAL_ZOOM: number = 1;
  private static readonly MAKS_ZOOM: number = 10;
  private static readonly MIN_ZOOM: number = 0.1;
  private static readonly MAKS_GRID_LINES: number = 100;

  public zoom$: Observable<number> = this.state.select('zoom');
  public position$: Observable<Point> = this.state.select('position');
  public mainCommand$: Observable<Command> = this.state.select('mainCommand');

  public draftSegment$: Observable<Segment | null> = this.state.select(
    ['position', 'zoom', 'draftSegment'],
    ({ position, zoom, draftSegment }) => {
      const translateVector = invertPoint(position);
      return draftSegment ? scaleSegment(translateSegment(draftSegment, translateVector), zoom) : null;
    }
  );

  public selectionArea$: Observable<PositionedRect | null> = this.state.select(
    ['position', 'zoom', 'selectionArea'],
    ({ position, zoom, selectionArea }) => {
      const translateVector = invertPoint(position);
      if (selectionArea) {
        const scaledSegment = scaleSegment(translateSegment(selectionArea, translateVector), zoom);
        const positionedRect = segmentToRect(scaledSegment);
        return positionedRect;
      } else {
        return null;
      }
    }
  )

  public mouseTooltip$: Observable<{
    label: string,
    screenMousePostion: Point
  }> = this.state.select(
    ['position', 'mouseScreenPosition', 'zoom'],
    ({ position, mouseScreenPosition, zoom }) => {
      const { x, y } = this._mouseScreenToReal(position, mouseScreenPosition, zoom);
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
    step: number;
    stepWidth: number;
    vertical: number[],
    horizontal: number[]
  }> = this.state.select(
    ['position', 'zoom', 'viewportSize'],
    ({ position, zoom, viewportSize }) => {

      const step: number = this._getStep(viewportSize.width, zoom);
      const verticalLinesNo = Math.ceil(viewportSize.width / zoom / step);
      const horizontalLinesNo = Math.ceil(viewportSize.height / zoom / step);

      return {
        step: step,
        stepWidth: step * zoom,
        vertical: this._getGridLines(verticalLinesNo, position.x, step, zoom),
        horizontal: this._getGridLines(horizontalLinesNo, position.y, step, zoom),
      }
    }
  );

  public viewportObjects$: Observable<WorkspaceObject[]> = this.state.select(
    ['zoom', 'position', 'viewportSize', 'objects'],
    ({ zoom, position, viewportSize, objects }) => {
      const visibleRect: PositionedRect = {
        point: { x: 0, y: 0 },
        width: viewportSize.width,
        height: viewportSize.height
      };

      const translateVector = invertPoint(position);

      let visible: WorkspaceObject[] = [];
      let notVisible: WorkspaceObject[] = [];
      let intersected: WorkspaceObject[] = [];

      objects.map((object: WorkspaceObject) => {
        const { geometry: segment } = object;
        return {
          ...object,
          geometry: scaleSegment(translateSegment(segment, translateVector), zoom)
        }
      }).forEach((object: WorkspaceObject) => {
        // TODO: calculate visible elements
        // calculate 2D function ax + b for segments
        visible.push(object)
      });

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
      ({ draftSegment, position, zoom, selectionArea }, mouseScreenPosition) => {
        const mouseReal = this._mouseScreenToReal(position, mouseScreenPosition, zoom)
        return ({
          mouseScreenPosition,
          draftSegment: draftSegment ? [draftSegment[0], mouseReal] : null,
          selectionArea: selectionArea ? [selectionArea[0], mouseReal] : null
        })
      }
    );
  }

  public connectClick(mouseClick$: Observable<MouseEvent>): void {
    this.state.connect(mouseClick$, ({ draftSegment, mouseScreenPosition, position, lastPosition, zoom, mainCommand, selectionArea }) => {
      if (isSamePoint(position, lastPosition)) {
        switch (mainCommand) {
          case Command.LINE:
            if (!draftSegment) {
              return this._createDraftSegment({ position, zoom, mouseScreenPosition });
            } else {
              return this._saveDraftSegment(draftSegment);
            }
          case Command.SELECT:
            if (!selectionArea) {
              return this._createSelectionArea({ position, zoom, mouseScreenPosition });
            } else {
              return this._applySelectionArea(selectionArea);
            }
        }
      } else {
        return { lastPosition: position };
      }
    });
  }

  public connectZoom(zoomChange$: Observable<number>): void {
    this.state.connect(zoomChange$, ({ zoom, position, viewportSize }, changeDirection) => {
      const mouseScreenPosition: Point = { x: viewportSize.width / 2, y: viewportSize.height / 2 };
      return this._handleZoomChange(zoom, position, mouseScreenPosition, changeDirection);
    })
  }

  public connectWheel(wheel$: Observable<WheelEvent>): void {
    this.state.connect(wheel$, ({ zoom, position }, event) => {
      event.preventDefault();
      const { deltaY, clientX, clientY } = event;
      const mouseScreenPosition: Point = { x: clientX, y: clientY };
      return this._handleZoomChange(zoom, position, mouseScreenPosition, deltaY);
    })
  }

  public connectMainCommand(command$: Observable<Command>): void {
    this.state.connect('mainCommand', command$);
  }

  private _createDraftSegment(
    { position, mouseScreenPosition, zoom }: Pick<WorkspaceState, 'position' | 'mouseScreenPosition' | 'zoom'>
  ): Pick<WorkspaceState, 'draftSegment'> {
    const mouseReal = this._mouseScreenToReal(position, mouseScreenPosition, zoom);
    return { draftSegment: [mouseReal, mouseReal] }
  };

  private _saveDraftSegment(draftSegment: Segment): Pick<WorkspaceState, 'draftSegment'> {
    const object = {
      id: uuidv4(),
      geometry: draftSegment
    };
    this.store.dispatch(ObjectActions.addObject({ object }));
    return { draftSegment: null };
  };

  private _createSelectionArea(
    { position, mouseScreenPosition, zoom }: Pick<WorkspaceState, 'position' | 'mouseScreenPosition' | 'zoom'>
  ): Pick<WorkspaceState, 'selectionArea'> {
    const mouseReal = this._mouseScreenToReal(position, mouseScreenPosition, zoom);
    return { selectionArea: [mouseReal, mouseReal] }
  };

  private _applySelectionArea(selectionArea: Segment): Pick<WorkspaceState, 'selectionArea'> {
    return { selectionArea: null }
  };

  private _handleZoomChange(zoom: number, position: Point, mouseScreenPosition: Point, changeDirection: number): Pick<WorkspaceState, 'zoom' | 'position' | 'lastPosition'> {
    const factor: number = this._getZoomChange(zoom, changeDirection);
    const newZoom = Math.min(Math.max(Math.round((zoom + factor) * 100) / 100, ViewportService.MIN_ZOOM), ViewportService.MAKS_ZOOM);

    const wheelPosition = this._mouseScreenToReal(position, mouseScreenPosition, zoom);
    const newWheelPosition = this._mouseScreenToReal(position, mouseScreenPosition, newZoom);
    const diff: Vector = getVector(wheelPosition, newWheelPosition);
    const newPosition = translatePoint(position, diff);

    return {
      zoom: newZoom,
      position: newPosition,
      lastPosition: newPosition
    }
  }

  private _mouseScreenToReal(realPosition: Point, mouseScreenPosition: Point, scale: number): Point {
    return {
      x: realPosition.x + mouseScreenPosition.x / scale,
      y: realPosition.y + mouseScreenPosition.y / scale,
    }
  }

  private _getZoomChange(currentZoom: number, changeDirection: number): number {
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

  private _getStep(viewportWidth: number, zoom: number): number {
    let step = 1;
    let linesCount = viewportWidth;
    do {
      step *= 10;
      linesCount = Math.floor(viewportWidth / zoom / step);
    } while (linesCount > ViewportService.MAKS_GRID_LINES);
    return step;
  }

  private _getGridLines(linesCount: number, position: number, step: number, scale: number): number[] {
    const firstLinePos = this._getFirstGridLinePos(position, step);

    return Array(linesCount).fill(null).reduce((acc, _, i) => {
      const linePos = (firstLinePos + step * i) - position;
      if (linePos !== position * -1) {
        acc.push(linePos * scale);
      }
      return acc;
    }, []);
  };

  private _getFirstGridLinePos(position: number, step: number): number {
    if (position < 0) {
      return position - (position % step);
    } else if (position > 0) {
      return position + (step - position % step)
    } else {
      return step;
    }
  };
}
