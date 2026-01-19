import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import {
  AlertService,
  CloudAppRestService,
} from '@exlibris/exl-cloudapp-angular-lib';

@Component({
  selector: 'app-circ-desk-select',
  templateUrl: './circ-desk-select.component.html',
  styleUrl: './circ-desk-select.component.scss',
})
export class CircDeskSelectComponent implements OnChanges {
  @Input() libraryCode: string | null = null;
  @Output() deskSelected = new EventEmitter<string>();

  loading = false;
  desks: Array<{ code: string; name: string }> = [];
  selectedDesk: string | null = null;

  constructor(private rest: CloudAppRestService, private alert: AlertService) {}

  ngOnChanges(): void {
    if (this.libraryCode) {
      this.fetchDesks(this.libraryCode);
    } else {
      this.desks = [];
      this.selectedDesk = null;
    }
  }

  private fetchDesks(lib: string): void {
    this.loading = true;

    this.rest
      .call<any>(`/almaws/v1/conf/libraries/${lib}/circ-desks`)
      .subscribe({
        next: (result) => {
          const rawList = Array.isArray(result?.circ_desk)
            ? result.circ_desk
            : result?.circ_desks?.circ_desk ?? [];

          this.desks = (rawList || []).map((d: any) => ({
            code: d.code || d.circ_desk_code || d.value || '',
            name: d.name || d.desc || d.label || d.description || d.code || '',
          }));

          if (this.desks.length === 1) {
            this.selectedDesk = this.desks[0].code;
            this.deskSelected.emit(this.selectedDesk);
          } else {
            this.selectedDesk = null;
          }
          this.loading = false;
        },
        error: (e) => {
          this.alert.error(
            'Failed to retrieve circulation desks: ' + e.message
          );
          this.desks = [];
          this.selectedDesk = null;
          this.loading = false;
        },
      });
  }

  onDeskChange(code: string): void {
    this.selectedDesk = code;
    this.deskSelected.emit(code);
  }
}
