import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { CursorData } from "../../models";
import { DecimalPipe } from "@angular/common";

@Component({
    selector: 'g[app-cursor-tooltip]',
    templateUrl: 'cursor-tooltip.component.svg',
    styleUrl: 'cursor-tooltip.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [DecimalPipe],
    standalone: true
})
export class CursorTooltipComponent {
    @Input({ required: true }) public cursorData!: CursorData;

    protected offsetX = 7;
    protected offsetY = 7;
}