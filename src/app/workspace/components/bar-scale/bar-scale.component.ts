import { NgStyle } from "@angular/common";
import { Component, Input } from "@angular/core";

@Component({
    selector: 'app-bar-scale',
    templateUrl: 'bar-scale.component.html',
    styleUrls: ['bar-scale.component.scss'],
    imports: [NgStyle],
    standalone: true
})
export class BarScaleComponent {
    @Input({ required: true }) public step!: number;
    @Input({ required: true }) public width!: number;
}
