import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, inject } from "@angular/core";

@Component({
    selector: 'button[app-button], button[app-button-icon]',
    templateUrl: 'button.component.html',
    styleUrl: 'button.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true
})
export class ButtonComponent {

    private readonly host: ElementRef = inject(ElementRef);

    private static readonly ATTRIBUTE_TO_CLASS = new Map([
        ['app-button', 'button'],
        ['app-button-icon', 'button-icon']
    ]);

    @HostBinding('class') get buttonClass(): string {
        const button = this.host.nativeElement as HTMLButtonElement; 
        for (let [attr, className] of ButtonComponent.ATTRIBUTE_TO_CLASS) {
            if (button.hasAttribute(attr)) {
                return className;
            }
        }
        throw new Error('[ButtonComponent] no selector attribute matched.');
    }
}
