import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ActionType = 'Loan' | 'Return' | 'Loan renewal';

@Component({
  selector: 'app-action-select',
  templateUrl: './action-select.component.html',
  styleUrls: ['./action-select.component.scss'],
})
export class ActionSelectComponent {
  /** Context, display only */
  @Input() libraryCode!: string;
  @Input() deskCode!: string;

  /** Loading state (spinner) */
  @Input() loading = false;

  /** Currently selected action shown in the dropdown */
  @Input() selectedAction: ActionType | null = null;

  /** Emit chosen action to parent */
  @Output() actionSelected = new EventEmitter<ActionType>();

  /** Dropdown options */
  actions: ActionType[] = ['Loan', 'Return', 'Loan renewal'];

  onActionSelected(action: ActionType): void {
    this.selectedAction = action;
    this.actionSelected.emit(action);
  }
}
