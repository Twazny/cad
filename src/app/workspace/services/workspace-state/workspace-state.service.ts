import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { rxState } from '@rx-angular/state';
import { Store } from '@ngrx/store';
import { v4 as uuidv4 } from 'uuid';

import {
  Rect,
  PositionedRect,
  Segment,
  scaleSegment,
  segmentToRect,
  translateSegment,
  Vector,
  getVector,
  Point,
  invertPoint,
  isSamePoint,
  translatePoint,
  getBoundingSegments,
  areSegmentsIntersecting,
  containsPoint,
} from '../../../geometry/models';
import {
  CursorData,
  Command,
  WorkspaceObject,
  WorkspaceState,
  ScaleChange,
} from '../../models';
import { selectAllObjects } from '../../store/object.selectors';
import * as ObjectActions from '../../store/object.actions';
import { roundSegment } from 'src/app/utils/round';

@Injectable()
export class WorkspaceStateService {
  private readonly store: Store = inject(Store);

  private readonly state = rxState<WorkspaceState>(({ set, connect }) => {
    set({
      scale: WorkspaceStateService.INITIAL_ZOOM,
      lastPosition: WorkspaceStateService.INITIAL_POSITION,
      position: WorkspaceStateService.INITIAL_POSITION,
      objects: [],
      selectedObjectIds: [],
      mainCommand: WorkspaceStateService.INITIAL_COMMAND,
    });
    connect('objects', this.store.select(selectAllObjects));
  });

  private static readonly INITIAL_COMMAND: Command = Command.SELECT;
  private static readonly INITIAL_POSITION: Point = { x: 0, y: 0 };
  private static readonly INITIAL_ZOOM: number = 1;
  private static readonly MAKS_GRID_LINES: number = 100;

  public zoom$: Observable<number> = this.state.select('scale');
  public workspaceSize$: Observable<Rect> = this.state.select('viewportSize');
  public position$: Observable<Point> = this.state.select('position');
  public mainCommand$: Observable<Command> = this.state.select('mainCommand');

  public draftSegment$: Observable<Segment | null> = this.state.select(
    ['position', 'scale', 'draftSegment'],
    ({ position, scale, draftSegment }) => {
      const translateVector = invertPoint(position);
      return draftSegment
        ? this._realSegmentToScreen(draftSegment, translateVector, scale)
        : null;
    }
  );

  public selectionArea$: Observable<PositionedRect | null> = this.state.select(
    ['position', 'scale', 'selectionArea'],
    ({ position, scale, selectionArea }) => {
      const translateVector = invertPoint(position);
      if (selectionArea) {
        const scaledSegment = this._realSegmentToScreen(
          selectionArea,
          translateVector,
          scale
        );
        const positionedRect = segmentToRect(scaledSegment);
        return positionedRect;
      } else {
        return null;
      }
    }
  );

  public isAnythingSelected$: Observable<boolean> = this.state.select(
    ['selectedObjectIds'],
    ({ selectedObjectIds }) => selectedObjectIds.length > 0
  );

  public mouseTooltip$: Observable<CursorData> = this.state.select(
    ['position', 'mouseScreenPosition', 'scale'],
    ({ position, mouseScreenPosition, scale }) => ({
      realMousePosition: this._mouseScreenToReal(
        position,
        mouseScreenPosition,
        scale
      ),
      screenMousePosition: mouseScreenPosition,
    })
  );

  public yAxis$: Observable<number> = this.state.select(
    ['position', 'scale'],
    ({ position, scale }) => {
      return -position.y * scale;
    }
  );

  public xAxis$: Observable<number> = this.state.select(
    ['position', 'scale'],
    ({ position, scale }) => {
      return -position.x * scale;
    }
  );

  public gridLines$: Observable<{
    step: number;
    stepWidth: number;
    vertical: number[];
    horizontal: number[];
  }> = this.state.select(
    ['position', 'scale', 'viewportSize'],
    ({ position, scale, viewportSize }) => {
      const step: number = this._getStep(viewportSize.width, scale);
      const verticalLinesNo = Math.ceil(viewportSize.width / scale / step);
      const horizontalLinesNo = Math.ceil(viewportSize.height / scale / step);

      return {
        step: step,
        stepWidth: step * scale,
        vertical: this._getGridLines(verticalLinesNo, position.x, step, scale),
        horizontal: this._getGridLines(
          horizontalLinesNo,
          position.y,
          step,
          scale
        ),
      };
    }
  );

  public viewportObjects$: Observable<
    (WorkspaceObject & { selected: boolean })[]
  > = this.state.select(
    ['scale', 'position', 'viewportSize', 'objects', 'selectedObjectIds'],
    ({ scale, position, viewportSize, objects, selectedObjectIds }) => {
      const visibleRect: PositionedRect = {
        point: { x: 0, y: 0 },
        width: viewportSize.width,
        height: viewportSize.height,
      };

      const translateVector = invertPoint(position);

      let visible: WorkspaceObject[] = [];
      let notVisible: WorkspaceObject[] = [];
      let intersected: WorkspaceObject[] = [];

      return objects.map((object: WorkspaceObject) => {
        const { geometry: segment } = object;
        return {
          ...object,
          geometry: roundSegment(
            this._realSegmentToScreen(segment, translateVector, scale),
            scale
          ),
          selected: selectedObjectIds.includes(object.id),
        };
      });
    }
  );

  public connectDrag(drag$: Observable<Vector>): void {
    this.state.connect(
      'position',
      drag$,
      ({ lastPosition, scale: zoom }, vector) => ({
        x: lastPosition.x + vector.x / zoom,
        y: lastPosition.y + vector.y / zoom,
      })
    );
  }

  public connectResize(viewportSize$: Observable<Rect>): void {
    this.state.connect('viewportSize', viewportSize$);
  }

  public connectMousemove(mouseMove$: Observable<MouseEvent>): void {
    this.state.connect(
      mouseMove$.pipe(
        map(({ clientX, clientY }) => ({ x: clientX, y: clientY }))
      ),
      (
        { draftSegment, position, scale: zoom, selectionArea, objects },
        mouseScreenPosition
      ) => {
        const mouseReal = this._mouseScreenToReal(
          position,
          mouseScreenPosition,
          zoom
        );
        return {
          mouseScreenPosition,
          ...(draftSegment && {
            draftSegment: [draftSegment[0], mouseReal],
          }),
          ...(selectionArea && {
            selectionArea: [selectionArea[0], mouseReal],
            selectedObjectIds: this._getSelectedObjects(selectionArea, objects),
          }),
        };
      }
    );
  }

  public connectClick(mouseClick$: Observable<MouseEvent>): void {
    this.state.connect(mouseClick$, (state: WorkspaceState) => {
      const { position, lastPosition, mainCommand } = state;
      if (isSamePoint(position, lastPosition)) {
        switch (mainCommand) {
          case Command.LINE:
            return this._handleClickInLineCommand(state);
          case Command.SELECT:
            return this._handleClickInSelectCommand(state);
        }
      } else {
        return { lastPosition: position };
      }
    });
  }

  public connectScaleChange(scaleChange$: Observable<ScaleChange>) {
    this.state.connect(
      scaleChange$,
      ({ position, scale: zoom }, { newScale, scalingCenter }) => {
        const wheelPosition = this._mouseScreenToReal(
          position,
          scalingCenter,
          zoom
        );

        const newWheelPosition = this._mouseScreenToReal(
          position,
          scalingCenter,
          newScale
        );
        const diff: Vector = getVector(wheelPosition, newWheelPosition);
        const newPosition = translatePoint(position, diff);

        return {
          scale: newScale,
          position: newPosition,
          lastPosition: newPosition,
        };
      }
    );
  }

  public connectMainCommand(command$: Observable<Command>): void {
    this.state.connect('mainCommand', command$);
  }

  public connectDelete(delete$: Observable<void>): void {
    this.state.connect(delete$, ({ selectedObjectIds }) => {
      this.store.dispatch(
        ObjectActions.deleteObjects({ objectIds: selectedObjectIds })
      );
      return {
        selectedObjectIds: [],
      };
    });
  }

  private _handleClickInSelectCommand({
    position,
    scale,
    mouseScreenPosition,
    selectedObjectIds,
    selectionArea,
  }: WorkspaceState): Partial<WorkspaceState> {
    if (!selectionArea) {
      if (selectedObjectIds.length > 0) {
        return { selectedObjectIds: [] };
      } else {
        return this._createSelectionArea({
          position,
          scale,
          mouseScreenPosition,
        });
      }
    } else {
      return this._applySelectionArea(selectionArea);
    }
  }

  private _handleClickInLineCommand({
    draftSegment,
    position,
    scale,
    mouseScreenPosition,
  }: WorkspaceState): Partial<WorkspaceState> {
    if (!draftSegment) {
      return this._createDraftSegment({ position, scale, mouseScreenPosition });
    } else {
      return this._saveDraftSegment(draftSegment);
    }
  }

  private _createDraftSegment({
    position,
    mouseScreenPosition,
    scale,
  }: Pick<WorkspaceState, 'position' | 'mouseScreenPosition' | 'scale'>): Pick<
    WorkspaceState,
    'draftSegment'
  > {
    const mouseReal = this._mouseScreenToReal(
      position,
      mouseScreenPosition,
      scale
    );
    return { draftSegment: [mouseReal, mouseReal] };
  }

  private _saveDraftSegment(
    draftSegment: Segment
  ): Pick<WorkspaceState, 'draftSegment'> {
    const object = {
      id: uuidv4(),
      geometry: draftSegment,
    };
    this.store.dispatch(ObjectActions.addObject({ object }));
    return { draftSegment: null };
  }

  private _getSelectedObjects(
    selectionArea: Segment,
    objects: WorkspaceObject[]
  ): string[] {
    const includeIntersected = selectionArea[0].x > selectionArea[1].x;
    const boundingSegments = getBoundingSegments(selectionArea);
    const selectionRect = segmentToRect(selectionArea);
    return objects
      .filter((object) => {
        return (
          this._isObjectContainedInSelection(selectionRect, object.geometry) ||
          (includeIntersected
            ? boundingSegments.some((segment) =>
                areSegmentsIntersecting(segment, object.geometry)
              )
            : false)
        );
      })
      .map(({ id }) => id);
  }

  private _isObjectContainedInSelection(
    rect: PositionedRect,
    segment: Segment
  ): boolean {
    return containsPoint(rect, segment[0]) && containsPoint(rect, segment[1]);
  }

  private _createSelectionArea({
    position,
    mouseScreenPosition,
    scale,
  }: Pick<WorkspaceState, 'position' | 'mouseScreenPosition' | 'scale'>): Pick<
    WorkspaceState,
    'selectionArea'
  > {
    const mouseReal = this._mouseScreenToReal(
      position,
      mouseScreenPosition,
      scale
    );
    return { selectionArea: [mouseReal, mouseReal] };
  }

  private _applySelectionArea(
    selectionArea: Segment
  ): Pick<WorkspaceState, 'selectionArea'> {
    return { selectionArea: null };
  }

  private _mouseScreenToReal(
    realPosition: Point,
    mouseScreenPosition: Point,
    scale: number
  ): Point {
    return {
      x: realPosition.x + mouseScreenPosition.x / scale,
      y: realPosition.y + mouseScreenPosition.y / scale,
    };
  }

  private _getStep(viewportWidth: number, zoom: number): number {
    let step = 1;
    let linesCount = viewportWidth;
    do {
      step *= 10;
      linesCount = Math.floor(viewportWidth / zoom / step);
    } while (linesCount > WorkspaceStateService.MAKS_GRID_LINES);
    return step;
  }

  private _getGridLines(
    linesCount: number,
    position: number,
    step: number,
    scale: number
  ): number[] {
    const firstLinePos = this._getFirstGridLinePos(position, step);

    return Array(linesCount)
      .fill(null)
      .reduce((acc, _, i) => {
        const linePos = firstLinePos + step * i - position;
        if (linePos !== position * -1) {
          acc.push(linePos * scale);
        }
        return acc;
      }, []);
  }

  private _getFirstGridLinePos(position: number, step: number): number {
    if (position < 0) {
      return position - (position % step);
    } else if (position > 0) {
      return position + (step - (position % step));
    } else {
      return step;
    }
  }

  private _realSegmentToScreen(
    segment: Segment,
    vector: Vector,
    scale: number
  ): Segment {
    return scaleSegment(translateSegment(segment, vector), scale);
  }
}
