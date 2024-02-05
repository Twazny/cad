import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  InputSignal,
  Output,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import {
  Segment,
  getSegmentLength,
  slope,
  slopeToAngle,
} from 'src/app/geometry/models';

@Component({
  selector: 'g[app-segment]',
  templateUrl: 'segment.component.svg',
  styleUrls: ['segment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  standalone: true,
})
export class SegmentComponent {
  public segment: InputSignal<Segment> = input.required();
  public selected: InputSignal<boolean> = input.required();

  @Output() public readonly hoveredChange: EventEmitter<boolean> =
    new EventEmitter();

  protected path = computed(() => this._calculatePath(this.segment()));
  protected rotate = computed(() => this._calculateRotate(this.segment()));
  protected hovered = signal(false);

  private readonly hoveredEffect = effect(() =>
    this.hoveredChange.emit(this.hovered())
  );

  private static readonly PROXIMITY_RADIUS = 10;

  private _calculateRotate(segment: Segment): string {
    const slopes = slope(segment);
    const angle = slopeToAngle(slopes);
    const [p1, p2] = segment;
    const p = p1.x > p2.x ? p2 : p1;
    return `rotate(${angle}, ${p.x}, ${p.y})`;
  }

  private _calculatePath(segment: Segment): string {
    const len = getSegmentLength(segment);
    const [p1, p2] = segment;
    const p = p1.x > p2.x ? p2 : p1;
    const r = SegmentComponent.PROXIMITY_RADIUS;
    return `
    M ${p.x} ${p.y - r}
    A ${r} ${r} 0 1 0 ${p.x} ${p.y + r}
    l ${len} 0
    A ${r} ${r} 0 1 0 ${p.x + len} ${p.y - r}
    l -${len} 0`;
  }
}
