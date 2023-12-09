import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
    selector: 'app-icon',
    templateUrl: 'icon.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true
})
export class IconComponent {}
