import { ChangeDetectionStrategy, Component, OnInit, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ButtonComponent, ButtonGroupComponent, IconComponent, ButtonGroupOptionDirective } from "src/app/ui/components";
import { WorkspaceStateService } from "../../services/workspace-state/workspace-state.service";
import { Command } from "../../models/command.enum";
import { AsyncPipe } from "@angular/common";
import { Subject } from "rxjs";

@Component({
    selector: 'app-toolbar',
    templateUrl: 'toolbar.component.html',
    styleUrl: 'toolbar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, ButtonGroupComponent, IconComponent, ButtonGroupOptionDirective, ReactiveFormsModule, AsyncPipe],
    standalone: true
})
export class ToolbarComponent implements OnInit {

    private readonly workspaceState = inject(WorkspaceStateService);

    protected readonly Command = Command;
    protected readonly modeControl = new FormControl(Command.SELECT, { nonNullable: true }); 
    protected readonly isAnythingSelected$ = this.workspaceState.isAnythingSelected$;
    protected readonly delete$: Subject<void> = new Subject();

    public ngOnInit(): void {
        this.workspaceState.mainCommand$.subscribe((command) => this.modeControl.patchValue(command));
        this.workspaceState.connectMainCommand(this.modeControl.valueChanges);
        this.workspaceState.connectDelete(this.delete$);
    }
}
