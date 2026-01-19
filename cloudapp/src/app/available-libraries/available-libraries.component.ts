import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import {
  CloudAppRestService,
  AlertService,
} from '@exlibris/exl-cloudapp-angular-lib';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'app-available-libraries',
  templateUrl: './available-libraries.component.html',
  styleUrl: './available-libraries.component.scss',
})
export class AvailableLibrariesComponent implements OnInit {
  @Output() librarySelected = new EventEmitter<string>();

  libraries: any[] = [];
  loading = false;
  selectedLibrary: string | null = null;

  constructor(
    private restService: CloudAppRestService,
    private alert: AlertService
  ) {}

  ngOnInit(): void {
    this.loadLibraries();
  }

  private loadLibraries(): void {
    this.loading = true;

    this.restService.call<any>('/almaws/v1/users/ME').subscribe({
      next: (user) => {
        const scopes: string[] = (user.user_role || [])
          .filter(
            (t: any) =>
              t.role_type?.desc?.toLowerCase() === 'circulation desk manager' ||
              t.role_type?.value === '221' ||
              t.role_type?.value === 221
          )
          .map((x: any) => x.scope?.value)
          .filter((v: any) => !!v);

        this.restService.call<any>('/almaws/v1/conf/libraries').subscribe({
          next: (result) => {
            this.libraries = (result.library || [])
              .filter((lib: any) => scopes.includes(lib.code))
              .sort((a: any, b: any) => a.code.localeCompare(b.code));
            this.loading = false;
          },
          error: (e) => {
            this.alert.error('Failed to retrieve libraries: ' + e.message);
            this.loading = false;
          },
        });
      },
      error: (e) => {
        this.alert.error('Failed to retrieve user: ' + e.message);
        this.loading = false;
      },
    });
  }

  onLibrarySelect(event: MatSelectChange): void {
    // event is a MatSelectChange: has .value, not event.target.value
    const code = event?.value ?? null;
    this.selectedLibrary = code;
    console.log('[AvailableLibraries] selected library:', code);
    if (code) this.librarySelected.emit(code);
  }
}

// extra defensive
// onLibrarySelect(event: MatSelectChange | undefined): void {
//   const code = event?.value ?? null;
//   this.selectedLibrary = code;
//   if (code) this.librarySelected.emit(code);
// }
