import { Component, Input, OnChanges } from "@angular/core";
import { Segment, getSegmentLength, slope, slopeToAngle } from "src/app/geometry/models";

@Component({
    selector: 'g[app-segment]',
    templateUrl: 'segment.component.svg',
    styleUrls: ['segment.component.scss'],
    standalone: true
})
export class SegmentComponent implements OnChanges {
    @Input({required: true}) segment!: Segment;

    protected path: string = '';
    protected rotate: string = '';

    public ngOnChanges(): void {
        const slopes =  slope(this.segment);
        const angle = slopeToAngle(slopes);
        const len = getSegmentLength(this.segment);
        const [p1, p2] = this.segment;
        const p = p1.x > p2.x ? p2 : p1;
        this.rotate = `rotate(${angle}, ${p.x}, ${p.y})`
        this.path = `
        M ${p.x} ${p.y - 10}
        A 10 10 0 1 0 ${p.x} ${p.y + 10}
        l ${len} 0
        A 10 10 0 1 0 ${p.x + len} ${p.y - 10}
        l -${len} 0`;
    }
}