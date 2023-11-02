import { ChangeDetectionStrategy, Input, Output, EventEmitter } from "@angular/core";
import { Component } from "@angular/core";

@Component({
    selector: 'app-scale',
    templateUrl: './scale.component.html',
    styleUrls: ['./scale.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
})
export class ScaleComponent {
    @Input({ required: true }) scale!: number | null;

    @Output() scaleChange: EventEmitter<number> = new EventEmitter();
}
