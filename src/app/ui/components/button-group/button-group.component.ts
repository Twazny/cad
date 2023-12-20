import { ChangeDetectionStrategy, Component, forwardRef } from "@angular/core";
import { SelectionModel } from '@angular/cdk/collections';
import { ButtonGroupOptionDirective } from "./button-group-option/button-group-option.directive";
import { NgTemplateOutlet } from "@angular/common";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

@Component({
    selector: 'app-button-group',
    templateUrl: 'button-group.component.html',
    styleUrl: 'button-group.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonGroupOptionDirective, NgTemplateOutlet],
    host: {
        'role': 'group',
        '(focusout)': '_onTouch()'
    },
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ButtonGroupComponent),
            multi: true
        }
    ],
    standalone: true
})
export class ButtonGroupComponent<T> implements ControlValueAccessor {
    private selection: SelectionModel<T> = new SelectionModel();

    private _onChange: (value: T) => void = (value: T) => void 0;
    private _onTouch: () => void = () => void 0;

    public selectOption(value: T): void {
        this.selection.select(value);
        this._onChange(value);
    }

    public registerOnChange(fn: (value: T) => void): void {
        this._onChange = fn;
    }

    public registerOnTouched(fn: () => void): void {
        this._onTouch = fn;
    }

    public writeValue(value: T): void {
        this.selection.select(value);
    }

    public get selectedOption(): T {
        return this.selection.selected[0];
    }
}
