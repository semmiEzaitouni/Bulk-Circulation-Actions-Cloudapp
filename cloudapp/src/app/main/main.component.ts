import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatRadioChange } from '@angular/material/radio';
import {
  AlertService,
  CloudAppEventsService,
  CloudAppRestService,
  Entity,
  HttpMethod,
  Request,
  RestErrorResponse,
} from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { ScanInUpload } from '../file-upload/file-upload.component';
import { ExecutePayload } from '../execute/execute.component';
// import { ExecutionSummary, UploadResult } from '../execute/execute.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit, OnDestroy {
  loading = false;
  selectedEntity: Entity | null = null;
  apiResult: any;

  entities$: Observable<Entity[]>;

  selectedLibrary: string | null = null;
  selectedDesk: string | null = null;
  selectedAction: 'Loan' | 'Return' | 'Loan renewal' | null = null;

  parsedUpload: ScanInUpload | null = null;
  executing = false;

  step: 'library' | 'desk' | 'action' | 'upload' = 'library';

  copyMessage: string | null = null;
  // uploadedFile: UploadResult | null = null;
  // execSummary: ExecutionSummary | null = null;

  copyToClipboard() {
    if (!this.copyMessage) return;

    navigator.clipboard.writeText(this.copyMessage).then(() => {
      this.alert.success('Message copied to clipboard');
      this.copyMessage = null; // makes the copy button dissapear again
    });
  }
  onLibrarySelected(libCode: string) {
    console.log('selectedLibrary:', libCode);
    this.selectedLibrary = libCode;
    this.selectedDesk = null;
  }

  onDeskSelected(deskCode: string) {
    console.log('selectedDesk:', deskCode);
    this.selectedDesk = deskCode;
    this.step = 'action';
  }

  onActionSelected(action: 'Loan' | 'Return' | 'Loan renewal'): void {
    this.selectedAction = action;
    // g to file upload
    this.step = 'upload';
    this.parsedUpload = null; // reset any previous upload if any
  }
  onFileParsed(payload: ScanInUpload) {
    this.parsedUpload = payload;
  }

  onUploadCleared() {
    this.parsedUpload = null;
    this.executing = false; // ensure button state is reset
    this.step = 'action'; // show the Action select step again
  }

  get executePayload(): ExecutePayload | null {
    if (!this.parsedUpload) return null;
    return {
      action: this.parsedUpload.action,
      libraryCode: this.parsedUpload.libraryCode,
      deskCode: this.parsedUpload.deskCode,
      fileName: this.parsedUpload.fileName,
      totalCount: this.parsedUpload.barcodes.length,
    };
  }
  private extractAlmaError(error: any): string {
    try {
      const almaError =
        error?.error?.errorList?.error?.[0] || error?.errorList?.error?.[0];

      if (almaError) {
        return (
          almaError.errorMessage ||
          almaError.errorDescription ||
          almaError.errorCode ||
          'Unknown Alma error'
        );
      }

      if (typeof error === 'string') {
        return error;
      }

      return JSON.stringify(error);
    } catch {
      return 'Unknown Alma error';
    }
  }

  onExecuteClicked() {
    if (!this.parsedUpload) return;
    this.executing = true;

    const { action, libraryCode, deskCode, barcodes } = this.parsedUpload;

    console.log(
      'Starting bulk operation:',
      action,
      'for',
      barcodes.length,
      'items'
    );

    // Execute the appropriate bulk action
    switch (action) {
      case 'Loan':
        this.bulkLoan(
          barcodes as Array<{ itemBarcode: string; primaryId?: string }>
        );
        break;
      case 'Return':
        this.bulkReturn(barcodes as string[], libraryCode, deskCode);
        break;
      case 'Loan renewal':
        this.bulkRenew(
          barcodes as Array<{ itemBarcode: string; primaryId?: string }>
        );
        break;
      default:
        this.executing = false;
        this.alert.error('Unknown action: ' + action);
    }
  }
  private bulkLoan(items: Array<{ itemBarcode: string; primaryId?: string }>) {
    let successful = 0;
    let failed = 0;
    const errors: Array<{ barcode: string; userId?: string; reason: string }> =
      [];

    console.log('=== STARTING BULK LOAN ===');
    console.log('Total items:', items.length);

    const processNext = (index: number) => {
      if (index >= items.length) {
        console.log('=== COMPLETE: Success:', successful, 'Failed:', failed);
        this.executing = false;
        this.showResults('Loan', successful, failed, errors);
        return;
      }

      const item = items[index];

      if (!item.primaryId) {
        failed++;
        errors.push({
          barcode: item.itemBarcode,
          reason: 'Missing Primary ID',
        });
        processNext(index + 1);
        return;
      }

      // Step 1: Get item details
      this.restService
        .call({
          url: '/almaws/v1/items',
          method: HttpMethod.GET,
          queryParams: { item_barcode: item.itemBarcode },
        })
        .subscribe({
          next: (itemResponse: any) => {
            const mms_id = itemResponse?.bib_data?.mms_id;
            const holding_id = itemResponse?.holding_data?.holding_id;
            const item_pid = itemResponse?.item_data?.pid;

            if (!mms_id || !holding_id || !item_pid) {
              failed++;
              errors.push({
                barcode: item.itemBarcode,
                userId: item.primaryId,
                reason: 'Incomplete item data',
              });
              processNext(index + 1);
              return;
            }

            // Step 2: Build request body with library and circ desk
            const requestBody = {
              circ_desk: { value: this.selectedDesk },
              return_circ_desk: { value: this.selectedDesk },
              library: { value: this.selectedLibrary },
              request_id: { value: '' },
            };

            // Step 3: Loan the item via POST with JSON body
            this.restService
              .call({
                url: `/almaws/v1/bibs/${mms_id}/holdings/${holding_id}/items/${item_pid}/loans`,
                method: HttpMethod.POST,
                queryParams: { user_id: item.primaryId },
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                },
                requestBody,
              })
              .subscribe({
                next: () => {
                  successful++;
                  console.log(`Loan created: ${item.itemBarcode}`);
                  processNext(index + 1);
                },
                error: (error: RestErrorResponse) => {
                  failed++;
                  errors.push({
                    barcode: item.itemBarcode,
                    userId: item.primaryId,
                    reason: this.extractAlmaError(error),
                  });
                  console.error(
                    ` Loan failed: ${item.itemBarcode}`,
                    error.message
                  );
                  processNext(index + 1);
                },
              });
          },
          error: (error: RestErrorResponse) => {
            failed++;
            errors.push({
              barcode: item.itemBarcode,
              userId: item.primaryId,
              reason: this.extractAlmaError(error),
            });
            console.error(
              ` Item lookup failed: ${item.itemBarcode}`,
              error.message
            );
            processNext(index + 1);
          },
        });
    };

    processNext(0);
  }

  private bulkReturn(
    barcodes: string[],
    libraryCode: string,
    deskCode: string
  ) {
    let successful = 0;
    let failed = 0;
    const errors: any[] = [];

    const processNext = (index: number) => {
      if (index >= barcodes.length) {
        this.executing = false;
        this.showResults('Return', successful, failed, errors);
        return;
      }
      const barcode = barcodes[index];

      console.log(
        `Processing return ${index + 1}/${barcodes.length}: ${barcode}`
      );

      // Step 1: Find item by barcode
      const findRequest: Request = {
        url: '/almaws/v1/items',
        method: HttpMethod.GET,
        queryParams: { item_barcode: barcode },
      };

      this.restService.call(findRequest).subscribe({
        next: (itemResult: any) => {
          if (!itemResult.link) {
            failed++;
            errors.push({ barcode: barcode });
            console.error(` No link for item: ${barcode}`);
            processNext(index + 1);
            return;
          }

          // Step 2: Scan-In (return) at desk
          const scanRequest: Request = {
            url: itemResult.link,
            method: HttpMethod.POST,
            queryParams: {
              op: 'scan',
              library: libraryCode,
              circ_desk: deskCode,
              in_house: 'false',
            },
          };

          this.restService.call(scanRequest).subscribe({
            next: () => {
              successful++;
              console.log(` Return successful: ${barcode}`);
              processNext(index + 1);
            },
            error: (error: RestErrorResponse) => {
              failed++;
              errors.push({ barcode: barcode });
              console.error(` Return scan failed: ${barcode}`, error.message);
              processNext(index + 1);
            },
          });
        },
        error: (error: RestErrorResponse) => {
          failed++;
          errors.push({ barcode: barcode });
          console.error(` Find item failed: ${barcode}`, error.message);
          processNext(index + 1);
        },
      });
    };

    processNext(0);
  }

  private bulkRenew(items: Array<{ itemBarcode: string; primaryId?: string }>) {
    let successful = 0;
    let failed = 0;
    const errors: Array<{ barcode: string; userId?: string; reason: string }> =
      [];

    // Store item details after successful returns
    const returnedItems: Array<{
      barcode: string;
      primaryId: string;
      mms_id: string;
      holding_id: string;
      item_pid: string;
    }> = [];

    console.log('=== STARTING BULK RENEW (All Returns, Then All Loans) ===');
    console.log('Total items to renew:', items.length);

    // PHASE 1: Process all returns
    const processReturns = (index: number) => {
      if (index >= items.length) {
        console.log('=== ALL RETURNS COMPLETE ===');
        console.log('Successfully returned:', returnedItems.length);
        console.log('Failed returns:', failed);

        // Start loan phase
        console.log('=== STARTING LOAN PHASE ===');
        processLoans(0);
        return;
      }

      const item = items[index];

      if (!item.primaryId) {
        failed++;
        errors.push({
          barcode: item.itemBarcode,
          reason: 'Missing Primary ID',
        });
        processReturns(index + 1);
        return;
      }

      console.log(
        `Processing return ${index + 1}/${items.length}: ${item.itemBarcode}`
      );

      // STEP 1: Find item by barcode
      this.restService
        .call({
          url: '/almaws/v1/items',
          method: HttpMethod.GET,
          queryParams: { item_barcode: item.itemBarcode },
        })
        .subscribe({
          next: (itemResult: any) => {
            if (!itemResult.link) {
              failed++;
              errors.push({
                barcode: item.itemBarcode,
                userId: item.primaryId,
                reason: 'No link found for item',
              });
              console.error(`No link for item: ${item.itemBarcode}`);
              processReturns(index + 1);
              return;
            }

            const mms_id = itemResult.bib_data?.mms_id;
            const holding_id = itemResult.holding_data?.holding_id;
            const item_pid = itemResult.item_data?.pid;

            if (!mms_id || !holding_id || !item_pid) {
              failed++;
              errors.push({
                barcode: item.itemBarcode,
                userId: item.primaryId,
                reason: 'Incomplete item data',
              });
              processReturns(index + 1);
              return;
            }

            // STEP 2: Return the item (scan-in at desk)
            this.restService
              .call({
                url: itemResult.link,
                method: HttpMethod.POST,
                queryParams: {
                  op: 'scan',
                  library: this.selectedLibrary!,
                  circ_desk: this.selectedDesk!,
                  in_house: 'false',
                },
              })
              .subscribe({
                next: () => {
                  console.log(`Return successful: ${item.itemBarcode}`);

                  // Store details for loan phase
                  returnedItems.push({
                    barcode: item.itemBarcode,
                    primaryId: item.primaryId!,
                    mms_id,
                    holding_id,
                    item_pid,
                  });

                  processReturns(index + 1);
                },
                error: (error: RestErrorResponse) => {
                  failed++;
                  errors.push({
                    barcode: item.itemBarcode,
                    userId: item.primaryId,
                    reason: `Return failed: ${this.extractAlmaError(error)}`,
                  });
                  console.error(
                    `Return scan failed: ${item.itemBarcode}`,
                    error.message
                  );
                  processReturns(index + 1);
                },
              });
          },
          error: (error: RestErrorResponse) => {
            failed++;
            errors.push({
              barcode: item.itemBarcode,
              userId: item.primaryId,
              reason: `Item lookup failed: ${this.extractAlmaError(error)}`,
            });
            console.error(
              `Find item failed: ${item.itemBarcode}`,
              error.message
            );
            processReturns(index + 1);
          },
        });
    };

    // PHASE 2: Process all loans
    const processLoans = (index: number) => {
      if (index >= returnedItems.length) {
        console.log('=== BULK RENEW COMPLETE ===');
        console.log('Successful renewals:', successful);
        console.log('Failed:', failed);
        this.executing = false;
        this.showResults('Loan renewal', successful, failed, errors);
        return;
      }

      const item = returnedItems[index];
      console.log(
        `Creating loan ${index + 1}/${returnedItems.length}: ${item.barcode}`
      );

      const requestBody = {
        circ_desk: { value: this.selectedDesk },
        return_circ_desk: { value: this.selectedDesk },
        library: { value: this.selectedLibrary },
        request_id: { value: '' },
      };

      this.restService
        .call({
          url: `/almaws/v1/bibs/${item.mms_id}/holdings/${item.holding_id}/items/${item.item_pid}/loans`,
          method: HttpMethod.POST,
          queryParams: {
            user_id: item.primaryId,
            override: 'true',
          },
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          requestBody,
        })
        .subscribe({
          next: () => {
            successful++;
            console.log(`New loan created: ${item.barcode}`);
            processLoans(index + 1);
          },
          error: (error: RestErrorResponse) => {
            failed++;
            errors.push({
              barcode: item.barcode,
              userId: item.primaryId,
              reason: `New loan failed: ${this.extractAlmaError(error)}`,
            });
            console.error(`New loan failed: ${item.barcode}`, error.message);
            processLoans(index + 1);
          },
        });
    };

    // Start the return phase
    processReturns(0);
  }
  private lastResultMessage = '';

  private showResults(
    action: 'Loan' | 'Return' | 'Loan renewal',
    successful: number,
    failed: number,
    errors: Array<{ barcode: string; userId?: string; reason: string }>
  ) {
    const total = successful + failed;

    // Compose a nice copyable summary including Alma error reasons
    const failedDetails = errors.length
      ? errors
          .map(
            (e) =>
              `• Barcode: ${e.barcode}` +
              (e.userId ? ` | User: ${e.userId}` : '') +
              ` | Reason: ${e.reason}`
          )
          .join('\n')
      : 'None';

    const message = `
Bulk ${action} Results
-----------------
Total items: ${total}
Successful: ${successful}
Failed: ${failed}

Failures:
${failedDetails}
`.trim();

    console.log(message);
    this.lastResultMessage = message;
    this.copyMessage = message; // for copy-to-clipboard button

    // Show toast
    if (failed === 0) {
      this.alert.success(
        `${action} completed successfully for all ${total} items`
      );
    } else if (successful === 0) {
      this.alert.error(
        `${action} failed for all ${total} items. Click "Copy" to see full details.`
      );
    } else {
      this.alert.warn(
        `${action} partially completed: ${successful}/${total} successful, ${failed} failed. Click "Copy" to see full details.`
      );
    }
  }

  constructor(
    private restService: CloudAppRestService,
    private eventsService: CloudAppEventsService,
    private alert: AlertService,
    private translate: TranslateService
  ) {
    this.entities$ = this.eventsService.entities$.pipe(tap(() => this.clear()));
  }

  ngOnInit() {}
  ngOnDestroy(): void {}

  entitySelected(event: MatRadioChange) {
    const value = event.value as Entity;
    this.loading = true;
    this.restService
      .call<any>(value.link)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => (this.apiResult = result),
        error: (error) =>
          this.alert.error('Failed to retrieve entity: ' + error.message),
      });
  }

  clear() {
    this.apiResult = null;
    this.selectedEntity = null;
  }

  update(value: any) {
    const requestBody = this.tryParseJson(value);
    if (!requestBody) return this.alert.error('Failed to parse json');

    this.loading = true;
    let request: Request = {
      url: this.selectedEntity!.link,
      method: HttpMethod.PUT,
      requestBody,
    };
    this.restService
      .call(request)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.apiResult = result;
          this.eventsService
            .refreshPage()
            .subscribe(() => this.alert.success('Success'));
        },
        error: (e: RestErrorResponse) => {
          this.alert.error('Failed to update data: ' + e.message);
          console.error(e);
        },
      });
  }

  setLang(lang: string) {
    this.translate.use(lang);
  }

  private tryParseJson(value: any) {
    try {
      return JSON.parse(value);
    } catch (e) {
      console.error(e);
    }
    return undefined;
  }
}
