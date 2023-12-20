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

  private readonly viewportService: WorkspaceStateService = inject(WorkspaceStateService);

  protected readonly objects$ = this.viewportService.viewportObjects$;
  protected readonly position$ = this.viewportService.position$;
  protected readonly zoom$ = this.viewportService.zoom$;
  protected readonly xAxis$ = this.viewportService.xAxis$;
  protected readonly yAxis$ = this.viewportService.yAxis$;
  protected readonly mouseTooltip$ = this.viewportService.mouseTooltip$;
  protected readonly draftSegment$ = this.viewportService.draftSegment$;
  protected readonly selectionArea$ = this.viewportService.selectionArea$;

  protected readonly gridLinesVertical$ = this.viewportService.gridLines$.pipe(map((lines) => lines.vertical));
  protected readonly gridLinesHorizontal$ = this.viewportService.gridLines$.pipe(map((lines) => lines.horizontal));
  protected readonly barScale$ = this.viewportService.gridLines$.pipe(map(({ step, stepWidth }) => ({ step, stepWidth })));

  dragEnd$: Subject<void> = new Subject();
  drag$: Subject<Vector> = new Subject();
  resize$: Subject<Rect> = new Subject();
  wheel$: Subject<WheelEvent> = new Subject();
  scaleChange$: Subject<number> = new Subject();
  click$: Subject<MouseEvent> = new Subject();
  mousemove$: Subject<MouseEvent> = new Subject();

  public ngOnInit(): void {
    this.viewportService.connectResize(this.resize$);
    this.viewportService.connectWheel(this.wheel$);
    this.viewportService.connectDrag(this.drag$);
    this.viewportService.connectZoom(this.scaleChange$);
    this.viewportService.connectMousemove(this.mousemove$);
    this.viewportService.connectClick(this.click$);
  }
}
