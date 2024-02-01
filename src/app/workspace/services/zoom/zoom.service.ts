import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkspaceStateService } from '../workspace-state/workspace-state.service';
import { Point, Rect } from 'src/app/geometry/models';
import { ScaleChange } from '../../models';
import { rxState } from '@rx-angular/state';

@Injectable()
export class ZoomService {
  private readonly workspaceState = inject(WorkspaceStateService);
  private readonly state = rxState<{
    scale: number;
    workspaceSize: Rect;
    scalingCenter: Point;
  }>(({ connect }) => {
    connect('scale', this.workspaceState.zoom$);
    connect('workspaceSize', this.workspaceState.workspaceSize$);
  });

  public scaleChange$: Observable<ScaleChange> = this.state.select(
    ['scale', 'scalingCenter'],
    ({ scale, scalingCenter }) => ({ newScale: scale, scalingCenter })
  );

  private static readonly MAKS_ZOOM: number = 10;
  private static readonly MIN_ZOOM: number = 0.1;

  public constructor() {
    this.workspaceState.connectScaleChange(this.scaleChange$);
  }

  public connectZoom(zoomChange$: Observable<number>): void {
    this.state.connect(
      zoomChange$,
      ({ scale, workspaceSize }, changeDirection) => {
        const scalingCenter: Point = {
          x: workspaceSize.width / 2,
          y: workspaceSize.height / 2,
        };
        return {
          scale: this._getNewScale(scale, changeDirection),
          scalingCenter,
        };
      }
    );
  }

  public connectWheel(wheel$: Observable<WheelEvent>): void {
    this.state.connect(wheel$, ({ scale }, event) => {
      const { deltaY, clientX, clientY } = event;
      const scalingCenter: Point = { x: clientX, y: clientY };
      return {
        scale: this._getNewScale(scale, deltaY),
        scalingCenter,
      };
    });
  }

  private _getNewScale(currentScale: number, changeDirection: number): number {
    const factor: number = this._getZoomChange(currentScale, changeDirection);
    const newScale = Math.min(
      Math.max(
        Math.round((currentScale + factor) * 100) / 100,
        ZoomService.MIN_ZOOM
      ),
      ZoomService.MAKS_ZOOM
    );
    return newScale;
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
}
