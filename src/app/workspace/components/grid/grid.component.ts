import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, debounceTime, map, mergeScan, of, scan, shareReplay, startWith, switchMap, switchScan, takeUntil, tap, throttleTime } from 'rxjs';
import { Point } from '../../../geometry/models/point';
import { ResizeDirective } from '../../directives/resize/resize.directive';
import { ViewportService } from '../../services/viewport.service';
import { DragDirective } from '../../directives/drag/drag.directive';
import { Vector } from '../../../geometry/models/vector';
import { Rect } from 'src/app/geometry/models/rect';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [CommonModule, ResizeDirective, DragDirective],
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss'],
  providers: [ViewportService]
})
export class GridComponent implements OnInit {


  private readonly viewportService: ViewportService = inject(ViewportService);

  protected readonly objects$ = this.viewportService.viewportObjects$;
  protected readonly position$ = this.viewportService.position$;
  protected readonly zoom$ = this.viewportService.zoom$;
  protected readonly xAxis$ = this.viewportService.xAxis$;
  protected readonly yAxis$ = this.viewportService.yAxis$;
  protected readonly xGridLines$ = this.viewportService.xGridLines$;

  dragEnd$: Subject<void> = new Subject();
  drag$: Subject<Vector> = new Subject();
  resize$: Subject<Rect> = new Subject();
  wheel$: Subject<WheelEvent> = new Subject();
 
  // viewBox$ = this.dragStart$.pipe(
  //   switchScan((acc) =>  {
  //     return this.drag$.pipe(
  //       map(({ x, y}) => ({x: acc.x - x * -1, y: acc.y - y * -1})),
  //     )
  //   }, {x: 0, y: 0}),
  //   startWith({x: 0, y: 0})
  // );

  public ngOnInit(): void {
    // this.viewBox$.subscribe(pos => this.viewportService.updatePosition(pos))

    this.viewportService.connectResize(this.resize$);
    this.viewportService.connectWheel(this.wheel$);
    this.viewportService.connectDrag(this.drag$);
    this.viewportService.connectDragEnd(this.dragEnd$);
  }
}
