import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
    selector: 'g[app-grid]',
    templateUrl: 'grid.component.svg',
    styleUrl: 'grid.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true
})
export class GridComponent {
    @Input({ required: true }) public xAxis!: number;
    @Input({ required: true }) public yAxis!: number;
    @Input({ required: true }) public xLines!: number[];
    @Input({ required: true }) public yLines!: number[];
}