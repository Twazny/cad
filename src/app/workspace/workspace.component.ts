import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridComponent } from './components/grid/grid.component';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, GridComponent],
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent {

}
