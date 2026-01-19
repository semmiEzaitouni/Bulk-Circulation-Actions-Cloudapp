// // import { Component, EventEmitter, Input, Output } from '@angular/core';
// // import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
// // import { ActionType } from '../action-select/action-select.component';

// // export interface ScanInUpload {
// //   action: ActionType;
// //   libraryCode: string;
// //   deskCode: string;
// //   fileName: string;
// //   barcodes: string[];
// // }

// // @Component({
// //   selector: 'app-file-upload',
// //   templateUrl: './file-upload.component.html',
// //   styleUrls: ['./file-upload.component.scss'],
// // })
// // export class FileUploadComponent {
// //   @Input() libraryCode!: string;
// //   @Input() deskCode!: string;
// //   @Input() action!: ActionType;
// //   @Output() fileParsed = new EventEmitter<ScanInUpload>();

// //   loading = false;
// //   files: File[] = [];

// //   async onSelect(event: { addedFiles: File[] }) {
// //     try {
// //       const added = event.addedFiles ?? [];
// //       if (!added.length) return;

// //       // enforce single file
// //       const file = added[0];
// //       this.files = [file];

// //       const ext = this.getExt(file.name);
// //       if (ext !== 'xlsx') {
// //         this.alert.error(
// //           'Please upload a .xlsx file with one barcode per line.'
// //         );
// //         this.files = [];
// //         return;
// //       }

// //       this.loading = true;

// //       // read text
// //       const text = await file.text();

// //       // split, trim, and filter
// //       const barcodes = text
// //         .split(/\r?\n/)
// //         .map((s) => s.trim())
// //         .filter((s) => !!s);

// //       if (!barcodes.length) {
// //         this.alert.warn('No barcodes found in the file.');
// //         this.loading = false;
// //         return;
// //       }
// //       console.log('barcodes: ', barcodes);

// //       // emit to parent to run the scan-in job
// //       this.fileParsed.emit({
// //         action: this.action,
// //         libraryCode: this.libraryCode,
// //         deskCode: this.deskCode,
// //         fileName: file.name,
// //         barcodes,
// //       });

// //       this.alert.success(
// //         `Loaded ${barcodes.length} barcode(s) from ${file.name}`
// //       );
// //     } catch (err: any) {
// //       this.alert.error('Failed to read file: ' + (err?.message || err));
// //     } finally {
// //       this.loading = false;
// //     }
// //   }

// //   onRemove(file: File) {
// //     this.files = this.files.filter((f) => f !== file);
// //   }

// //   private getExt(name: string): string {
// //     const i = name.lastIndexOf('.');
// //     return i >= 0 ? name.substring(i + 1).toLowerCase() : '';
// //   }

// //   constructor(private alert: AlertService) {}
// // }

// import { Component, EventEmitter, Input, Output } from '@angular/core';
// import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
// import { ActionType } from '../action-select/action-select.component';
// import * as XLSX from 'xlsx';

// export interface ScanInUpload {
//   action: ActionType;
//   libraryCode: string;
//   deskCode: string;
//   fileName: string;
//   barcodes: string[] | Array<{ itemBarcode: string; primaryId?: string }>;
//   // barcodes: Array<{
//   //   itemBarcode: string;
//   //   primaryId?: string;
//   // }>;
// }

// @Component({
//   selector: 'app-file-upload',
//   templateUrl: './file-upload.component.html',
//   styleUrls: ['./file-upload.component.scss'],
// })
// export class FileUploadComponent {
//   @Input() libraryCode!: string;
//   @Input() deskCode!: string;
//   @Input() action!: ActionType;
//   @Output() fileParsed = new EventEmitter<ScanInUpload>();
//   @Output() cleared = new EventEmitter<void>(); // for when removed uploaded fiel

//   loading = false;
//   file: File | null = null;

//   async onSelect(event: { addedFiles: File[] }) {
//     try {
//       const added = event?.addedFiles ?? [];
//       if (!added.length) return;

//       // single file only for now
//       const file = added[0];
//       this.file = file;

//       // only .xlsx
//       const ext = this.getExt(file.name);
//       if (ext !== 'xlsx') {
//         this.alert.error('Please upload a .xlsx file.');
//         this.file = null;
//         return;
//       }

//       this.loading = true;

//       // raed Excel and parse
//       const buffer = await file.arrayBuffer();
//       const wb = XLSX.read(buffer, { type: 'array' });

//       // se first worksheet
//       const ws = wb.Sheets[wb.SheetNames[0]];
//       if (!ws) {
//         this.alert.warn('No worksheet found in the .xlsx file.');
//         return;
//       }

//       // Get rows (2D array)
//       const rows: any[][] =
//         XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }) || [];
//       if (!rows.length) {
//         this.alert.warn('No data found in the worksheet.');
//         return;
//       }

//       // check for header with 'Barcode', if none -> take first column as barcodes
//       const header = (rows[0] || []).map((h: any) =>
//         (h ?? '').toString().trim().toLowerCase()
//       );
//       const hasHeader = header.includes('barcode');
//       const dataRows = hasHeader ? rows.slice(1) : rows;
//       const bcIdx = hasHeader ? header.indexOf('barcode') : 0;

//       const barcodes = dataRows
//         .map((r) => (r?.[bcIdx] ?? '').toString().trim())
//         .filter((v) => !!v);

//       if (!barcodes.length) {
//         this.alert.warn('No barcodes found in the worksheet.');
//         return;
//       }

//       // emit to prent
//       this.fileParsed.emit({
//         action: this.action,
//         libraryCode: this.libraryCode,
//         deskCode: this.deskCode,
//         fileName: file.name,
//         barcodes,
//       });

//       this.alert.success(
//         `Loaded ${barcodes.length} barcode(s) from ${file.name}`
//       );
//       console.log('barcodes: ', barcodes);
//     } catch (err: any) {
//       console.error(err);
//       this.alert.error('Failed to read .xlsx: ' + (err?.message || err));
//     } finally {
//       this.loading = false;
//     }
//   }

//   onRemove() {
//     this.file = null;
//     this.cleared.emit();
//   }

//   private getExt(name: string): string {
//     const i = name.lastIndexOf('.');
//     return i >= 0 ? name.substring(i + 1).toLowerCase() : '';
//   }

//   constructor(private alert: AlertService) {}
// }
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { ActionType } from '../action-select/action-select.component';
import * as XLSX from 'xlsx';

export interface ScanInUpload {
  action: ActionType;
  libraryCode: string;
  deskCode: string;
  fileName: string;
  barcodes: string[] | Array<{ itemBarcode: string; primaryId?: string }>;
}

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
})
export class FileUploadComponent {
  @Input() libraryCode!: string;
  @Input() deskCode!: string;
  @Input() action!: ActionType;
  @Output() fileParsed = new EventEmitter<ScanInUpload>();
  @Output() cleared = new EventEmitter<void>();

  loading = false;
  file: File | null = null;

  async onSelect(event: { addedFiles: File[] }) {
    try {
      const added = event?.addedFiles ?? [];
      if (!added.length) return;

      const file = added[0];
      this.file = file;

      const ext = this.getExt(file.name);
      if (ext !== 'xlsx') {
        this.alert.error('Please upload a .xlsx file.');
        this.file = null;
        return;
      }

      this.loading = true;

      // Read Excel and parse
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });

      // Use first worksheet
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) {
        this.alert.warn('No worksheet found in the .xlsx file.');
        return;
      }

      // Get rows (2D array)
      const rows: any[][] =
        XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }) || [];
      if (!rows.length) {
        this.alert.warn('No data found in the worksheet.');
        return;
      }

      // Parse header row (normalize to lowercase for comparison)
      const header = (rows[0] || []).map((h: any) =>
        (h ?? '').toString().trim().toLowerCase()
      );

      // Find column indices
      const barcodeIdx = this.findColumnIndex(header, ['barcode']);
      const primaryIdIdx = this.findColumnIndex(header, [
        'primary identifier',
        'primaryidentifier',
        'primary id',
        'primaryid',
        'patron id',
        'patronid',
        'user id',
        'userid',
      ]);

      if (barcodeIdx === -1) {
        this.alert.error(
          'Could not find "Barcode" column in the Excel file. Please ensure your file has a "Barcode" header.'
        );
        return;
      }

      // Check if action requires Primary Identifier
      const requiresPrimaryId =
        this.action === 'Loan' || this.action === 'Loan renewal';

      if (requiresPrimaryId && primaryIdIdx === -1) {
        this.alert.error(
          `${this.action} requires a "Primary Identifier" column. Please ensure your Excel has both "Barcode" and "Primary Identifier" columns.`
        );
        return;
      }

      // Parse data rows (skip header)
      const dataRows = rows.slice(1);
      let barcodes:
        | string[]
        | Array<{ itemBarcode: string; primaryId?: string }>;

      if (this.action === 'Return') {
        // For Return: just extract barcodes as string[]
        barcodes = dataRows
          .map((r) => (r?.[barcodeIdx] ?? '').toString().trim())
          .filter((v) => !!v);
      } else {
        // For Loan/Renewal: extract as objects with primaryId
        barcodes = dataRows
          .map((r) => {
            const itemBarcode = (r?.[barcodeIdx] ?? '').toString().trim();
            const primaryId = (r?.[primaryIdIdx] ?? '').toString().trim();
            return { itemBarcode, primaryId };
          })
          .filter((item) => !!item.itemBarcode); // Only keep rows with barcode
      }

      if (!barcodes.length) {
        this.alert.warn('No valid data found in the worksheet.');
        return;
      }

      // Validate that all items have primaryId if required
      if (requiresPrimaryId) {
        const itemsWithoutId = (
          barcodes as Array<{ itemBarcode: string; primaryId?: string }>
        ).filter((item) => !item.primaryId);

        if (itemsWithoutId.length > 0) {
          this.alert.error(
            `${itemsWithoutId.length} row(s) missing Primary Identifier. All rows must have both Barcode and Primary Identifier for ${this.action}.`
          );
          return;
        }
      }

      // Emit to parent
      this.fileParsed.emit({
        action: this.action,
        libraryCode: this.libraryCode,
        deskCode: this.deskCode,
        fileName: file.name,
        barcodes,
      });

      this.alert.success(`Loaded ${barcodes.length} item(s) from ${file.name}`);
      console.log('Parsed data:', barcodes);
    } catch (err: any) {
      console.error(err);
      this.alert.error('Failed to read .xlsx: ' + (err?.message || err));
    } finally {
      this.loading = false;
    }
  }

  /**
   * Helper to find column index by multiple possible names
   */
  private findColumnIndex(header: string[], possibleNames: string[]): number {
    for (const name of possibleNames) {
      const idx = header.indexOf(name);
      if (idx !== -1) return idx;
    }
    return -1;
  }

  onRemove() {
    this.file = null;
    this.cleared.emit();
  }

  private getExt(name: string): string {
    const i = name.lastIndexOf('.');
    return i >= 0 ? name.substring(i + 1).toLowerCase() : '';
  }

  constructor(private alert: AlertService) {}
}
