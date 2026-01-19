import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActionType } from '../action-select/action-select.component';

export interface ExecutePayload {
  action: ActionType;
  libraryCode: string;
  deskCode: string;
  fileName: string;
  totalCount: number;
}

@Component({
  selector: 'app-execute',
  templateUrl: './execute.component.html',
  styleUrls: ['./execute.component.scss'],
})
export class ExecuteComponent {
  @Input() payload!: ExecutePayload;

  //  disable  button when running
  @Input() disabled = false;

  //  emit on click
  @Output() execute = new EventEmitter<void>();

  onExecuteClick(): void {
    this.execute.emit();
  }
}
