import {
  Directive,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { Rect } from '../../../geometry/models/rect';

@Directive({
  selector: '[appResize]',
  standalone: true,
})
export class ResizeDirective implements OnInit, OnDestroy {
  @Output() public resizeChange: EventEmitter<Rect> = new EventEmitter();

  private readonly host: ElementRef = inject(ElementRef);
  private resizeObserver!: ResizeObserver;

  public ngOnInit(): void {
    this.resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      this.resizeChange.emit({ width, height });
    });
    this.resizeObserver.observe(this.host.nativeElement);
  }

  public ngOnDestroy(): void {
    this.resizeObserver.unobserve(this.host.nativeElement);
    this.resizeObserver.disconnect();
  }
}
