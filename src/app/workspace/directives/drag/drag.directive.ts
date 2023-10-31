import { Directive, ElementRef, Output, inject, EventEmitter, DestroyRef, OnInit } from "@angular/core";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, fromEvent, map, switchMap, takeUntil, tap } from "rxjs";
import { Vector } from "../../../geometry/models/vector";

@Directive({
    selector: '[appDrag]',
    standalone: true
})
export class DragDirective implements OnInit {
    @Output() drag: EventEmitter<Vector> = new EventEmitter();
    @Output() dragStart: EventEmitter<MouseEvent> = new EventEmitter();
    @Output() dragEnd: EventEmitter<MouseEvent> = new EventEmitter();

    private readonly host: ElementRef = inject(ElementRef);
    private readonly destroyRef = inject(DestroyRef);

    private readonly mouseDown$: Observable<MouseEvent> = fromEvent<MouseEvent>(this.host.nativeElement, 'mousedown')
        .pipe(tap((event) => this.dragStart.emit(event)));
    private readonly mouseUp$: Observable<MouseEvent> = fromEvent<MouseEvent>(this.host.nativeElement, 'mouseup')
        .pipe(tap((event) => this.dragEnd.emit(event)));
    private readonly mouseMove$: Observable<MouseEvent> = fromEvent<MouseEvent>(this.host.nativeElement, 'mousemove');
    private readonly mouseDrag$: Observable<Vector> = this.mouseDown$.pipe(
      switchMap(({screenX: beginX, screenY: beginY}) => this.mouseMove$.pipe(
        takeUntil(this.mouseUp$),
        map(({screenX: newX, screenY: newY}) => ({x: newX- beginX, y: newY - beginY})),
      )),
      tap((vector: Vector) => this.drag.emit(vector)),
      takeUntilDestroyed(this.destroyRef)
    );

    public ngOnInit(): void {
        this.mouseDrag$.subscribe();
    }
}
