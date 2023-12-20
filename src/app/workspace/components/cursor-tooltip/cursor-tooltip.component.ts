import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { CursorData } from "../../models";

@Component({
    selector: 'g[app-cursor-tooltip]',
    templateUrl: 'cursor-tooltip.component.svg',
    styleUrl: 'cursor-tooltip.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true
})
export class CursorTooltipComponent {
    @Input({ required: true }) public cursorData!: CursorData;
}