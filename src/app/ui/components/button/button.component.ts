import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  booleanAttribute,
  inject,
} from '@angular/core';

@Component({
  selector: 'button[app-button], button[app-button-icon]',
  templateUrl: 'button.component.html',
  styleUrl: 'button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'buttonClass',
    '[attr.disabled]': 'disabled || null',
  },
  standalone: true,
})
export class ButtonComponent {
  @Input({ transform: booleanAttribute }) public disabled: boolean = false;

  private readonly host: ElementRef = inject(ElementRef);

  private static readonly ATTRIBUTE_TO_CLASS = new Map([
    ['app-button', 'button'],
    ['app-button-icon', 'button-icon'],
  ]);

  private get buttonClass(): string {
    const button = this.host.nativeElement as HTMLButtonElement;
    for (const [attr, className] of ButtonComponent.ATTRIBUTE_TO_CLASS) {
      if (button.hasAttribute(attr)) {
        return className;
      }
    }
    throw new Error('[ButtonComponent] no selector attribute matched.');
  }
}
