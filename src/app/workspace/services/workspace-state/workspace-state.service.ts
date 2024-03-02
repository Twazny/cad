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
  WorkspaceState,
  ScaleChange,
  GridLines,
  PointEntity,
  SegmentState,
} from '../../models';
import { selectAllObjects } from '../../store/object.selectors';
import * as ObjectActions from '../../store/object.actions';
import { roundSegment } from 'src/app/utils/round';
import { DraftSegment } from '../../models/draft-segment.interface';
import { SegmentViewModel } from '../../models/segment-vm.interface';

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
      willBeSelectedIds: [],
      mainCommand: WorkspaceStateService.INITIAL_COMMAND,
      proximityId: null,
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

  public gridLines$: Observable<GridLines> = this.state.select(
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

  public viewportObjects$: Observable<SegmentViewModel[]> = this.state.select(
    [
      'scale',
      'position',
      'objects',
      'selectedObjectIds',
      'willBeSelectedIds',
      'proximityId',
    ],
    ({
      scale,
      position,
      objects,
      selectedObjectIds,
      willBeSelectedIds,
      proximityId,
    }) => {
      const translateVector = invertPoint(position);
      return objects.map((object: SegmentState) => {
        const { geometry: segment } = object;
        const transformedSegment = roundSegment(
          this._realSegmentToScreen(segment, translateVector, scale),
          scale
        );
        return {
          ...object,
          geometry: [
            {
              id: segment[0].id,
              ...transformedSegment[0],
              inProximity: segment[0].id === proximityId,
            },
            {
              id: segment[1].id,
              ...transformedSegment[1],
              inProximity: segment[1].id === proximityId,
            },
          ],
          inProximity: object.id === proximityId,
          isSelected:
            willBeSelectedIds.includes(object.id) ||
            selectedObjectIds.includes(object.id),
        };
      });
    }
  );

  public connectProximity(proximityId$: Observable<string | null>): void {
    this.state.connect('proximityId', proximityId$);
  }

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
            willBeSelectedIds: this._getSelectedObjects(selectionArea, objects),
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
    willBeSelectedIds,
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
      return this._applySelectionArea(willBeSelectedIds);
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
    const payload: DraftSegment = {
      id: uuidv4(),
      geometry: [
        (<PointEntity>draftSegment[0]).id
          ? (draftSegment[0] as PointEntity)
          : { id: uuidv4(), ...draftSegment[0] },
        (<PointEntity>draftSegment[1]).id
          ? (draftSegment[1] as PointEntity)
          : { id: uuidv4(), ...draftSegment[1] },
      ],
    };
    this.store.dispatch(ObjectActions.addObject(payload));
    return { draftSegment: null };
  }

  private _getSelectedObjects(
    selectionArea: Segment,
    segments: SegmentState[]
  ): string[] {
    const includeIntersected = selectionArea[0].x > selectionArea[1].x;
    const boundingSegments = getBoundingSegments(selectionArea);
    const selectionRect = segmentToRect(selectionArea);
    return segments
      .filter(segment => {
        return (
          this._isObjectContainedInSelection(selectionRect, segment.geometry) ||
          (includeIntersected
            ? boundingSegments.some(boundingSegment =>
                areSegmentsIntersecting(boundingSegment, segment.geometry)
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
    willBeSelectedIds: string[]
  ): Pick<
    WorkspaceState,
    'selectionArea' | 'selectedObjectIds' | 'willBeSelectedIds'
  > {
    return {
      selectionArea: null,
      selectedObjectIds: [...willBeSelectedIds],
      willBeSelectedIds: [],
    };
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
