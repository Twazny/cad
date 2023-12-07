import { NgClass } from "@angular/common";
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, WritableSignal, effect, signal } from "@angular/core";
import { Segment, getSegmentLength, slope, slopeToAngle } from "src/app/geometry/models";

@Component({
    selector: 'g[app-segment]',
    templateUrl: 'segment.component.svg',
    styleUrls: ['segment.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass],
    standalone: true
})
export class SegmentComponent implements OnChanges {
    @Input({required: true}) segment!: Segment;
    @Input({required: true}) selected: boolean = false;

    @Output() public readonly hoveredChange: EventEmitter<boolean> = new EventEmitter();

    protected path: string = '';
    protected rotate: string = '';

    protected hovered: WritableSignal<boolean> = signal(false);

    private readonly hoveredEffect = effect(() => this.hoveredChange.emit(this.hovered()));

    private static readonly PROXIMITY_RADIUS = 10;

    public ngOnChanges(): void {
        const slopes =  slope(this.segment);
        const angle = slopeToAngle(slopes);
        const len = getSegmentLength(this.segment);
        const [p1, p2] = this.segment;
        const p = p1.x > p2.x ? p2 : p1;
        this.rotate = `rotate(${angle}, ${p.x}, ${p.y})`
        const r = SegmentComponent.PROXIMITY_RADIUS;
        this.path = `
        M ${p.x} ${p.y - r}
        A ${r} ${r} 0 1 0 ${p.x} ${p.y + r}
        l ${len} 0
        A ${r} ${r} 0 1 0 ${p.x + len} ${p.y - r}
        l -${len} 0`;
    }
}