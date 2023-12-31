import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Subject, map } from 'rxjs';
import { ResizeDirective } from '../../directives/resize/resize.directive';
import { WorkspaceStateService } from '../../services/workspace-state.service';
import { DragDirective } from '../../directives/drag/drag.directive';
import { Vector, Rect } from '../../../geometry/models';
import { ScaleComponent, BarScaleComponent, SegmentComponent, GridComponent, ToolbarComponent, CursorTooltipComponent } from '../../components';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, ResizeDirective, DragDirective, ScaleComponent, NgIf, BarScaleComponent, SegmentComponent, GridComponent, ToolbarComponent, CursorTooltipComponent],
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss'],
  providers: [WorkspaceStateService]
})
export class WorkspaceComponent implements OnInit {

  private readonly workspaceState: WorkspaceStateService = inject(WorkspaceStateService);

  protected readonly objects$ = this.workspaceState.viewportObjects$;
  protected readonly position$ = this.workspaceState.position$;
  protected readonly zoom$ = this.workspaceState.zoom$;
  protected readonly xAxis$ = this.workspaceState.xAxis$;
  protected readonly yAxis$ = this.workspaceState.yAxis$;
  protected readonly mouseTooltip$ = this.workspaceState.mouseTooltip$;
  protected readonly draftSegment$ = this.workspaceState.draftSegment$;
  protected readonly selectionArea$ = this.workspaceState.selectionArea$;

  protected readonly gridLinesVertical$ = this.workspaceState.gridLines$.pipe(map((lines) => lines.vertical));
  protected readonly gridLinesHorizontal$ = this.workspaceState.gridLines$.pipe(map((lines) => lines.horizontal));
  protected readonly barScale$ = this.workspaceState.gridLines$.pipe(map(({ step, stepWidth }) => ({ step, stepWidth })));

  dragEnd$: Subject<void> = new Subject();
  drag$: Subject<Vector> = new Subject();
  resize$: Subject<Rect> = new Subject();
  wheel$: Subject<WheelEvent> = new Subject();
  scaleChange$: Subject<number> = new Subject();
  click$: Subject<MouseEvent> = new Subject();
  mousemove$: Subject<MouseEvent> = new Subject();

  public ngOnInit(): void {
    this.workspaceState.connectResize(this.resize$);
    this.workspaceState.connectWheel(this.wheel$);
    this.workspaceState.connectDrag(this.drag$);
    this.workspaceState.connectZoom(this.scaleChange$);
    this.workspaceState.connectMousemove(this.mousemove$);
    this.workspaceState.connectClick(this.click$);
  }
}
