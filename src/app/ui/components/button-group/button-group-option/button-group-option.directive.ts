import { Directive, Input, inject } from "@angular/core";
import { ButtonGroupComponent } from "../button-group.component";

@Directive({
    selector: '[appButtonGroupOption]',
    host: {
        'role': 'radio',
        '[attr.aria-checked]': 'ariaChecked',
        '(click)': 'onOptionClick()'
    },
    standalone: true
})
export class ButtonGroupOptionDirective<T> {
    @Input({ required: true, alias: 'appButtonGroupOption' }) public value!: T;

    public readonly buttonGroup = inject(ButtonGroupComponent);

    private onOptionClick() {
        this.buttonGroup.selectOption(this.value);
    }

    private get ariaChecked(): boolean {
        return this.buttonGroup.selectedOption === this.value;
    }
}