import {
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { Component } from '@angular/core';
import { ButtonComponent } from 'src/app/ui/components/button/button.component';
import { IconComponent } from 'src/app/ui/components/icon/icon.component';

@Component({
  selector: 'app-scale',
  templateUrl: './scale.component.html',
  styleUrls: ['./scale.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, IconComponent],
  standalone: true,
})
export class ScaleComponent {
  @Input({ required: true }) scale!: number | null;

  @Output() scaleChange: EventEmitter<number> = new EventEmitter();
}
