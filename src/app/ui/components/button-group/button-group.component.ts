import { ChangeDetectionStrategy, Component } from "@angular/core";
import { SelectionModel } from '@angular/cdk/collections';
import { ButtonGroupOptionDirective } from "./button-group-option/button-group-option.directive";
import { NgTemplateOutlet } from "@angular/common";

@Component({
    selector: 'app-button-group',
    templateUrl: 'button-group.component.html',
    styleUrl: 'button-group.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonGroupOptionDirective, NgTemplateOutlet],
    standalone: true
})
export class ButtonGroupComponent<T> {
    private selection: SelectionModel<T> = new SelectionModel();

    public selectOption(value: T): void {
        this.selection.select(value);
    }

    public get selectedOption(): T {
        return this.selection.selected[0];
    }
}
