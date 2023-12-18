import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ButtonComponent, ButtonGroupComponent, IconComponent, ButtonGroupOptionDirective } from "src/app/ui/components";

@Component({
    selector: 'app-toolbar',
    templateUrl: 'toolbar.component.html',
    styleUrl: 'toolbar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, ButtonGroupComponent, IconComponent, ButtonGroupOptionDirective],
    standalone: true
})
export class ToolbarComponent {

}
