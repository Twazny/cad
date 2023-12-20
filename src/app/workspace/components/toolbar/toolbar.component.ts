import { ChangeDetectionStrategy, Component, OnInit, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ButtonComponent, ButtonGroupComponent, IconComponent, ButtonGroupOptionDirective } from "src/app/ui/components";
import { WorkspaceStateService } from "../../services/workspace-state.service";
import { Command } from "../../models/command.enum";

@Component({
    selector: 'app-toolbar',
    templateUrl: 'toolbar.component.html',
    styleUrl: 'toolbar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, ButtonGroupComponent, IconComponent, ButtonGroupOptionDirective, ReactiveFormsModule],
    standalone: true
})
export class ToolbarComponent implements OnInit {
    protected readonly Command = Command;
    protected readonly modeControl = new FormControl(Command.SELECT, { nonNullable: true });

    private readonly viewportService = inject(WorkspaceStateService);

    public ngOnInit(): void {
        this.viewportService.mainCommand$.subscribe((command) => this.modeControl.patchValue(command));
        this.viewportService.connectMainCommand(this.modeControl.valueChanges);
    }
}
