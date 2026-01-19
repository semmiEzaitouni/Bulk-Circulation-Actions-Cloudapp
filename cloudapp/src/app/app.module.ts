import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { APP_INITIALIZER, inject, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  AlertModule,
  CloudAppTranslateModule,
  InitService,
  MaterialModule,
} from '@exlibris/exl-cloudapp-angular-lib';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';
import { AvailableLibrariesComponent } from './available-libraries/available-libraries.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { NgxDropzoneModule } from 'ngx-dropzone';
// maybe chaneg this
import { CommonModule } from '@angular/common';
import { CircDeskSelectComponent } from './circ-desk-select/circ-desk-select.component';
import { ActionSelectComponent } from './action-select/action-select.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { ExecuteComponent } from './execute/execute.component';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    AvailableLibrariesComponent,
    CircDeskSelectComponent,
    ActionSelectComponent,
    FileUploadComponent,
    ExecuteComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    MaterialModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    AlertModule,
    FormsModule,
    ReactiveFormsModule,
    CloudAppTranslateModule.forRoot(),
    MatProgressBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatListModule,
    CommonModule,
    NgxDropzoneModule,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => true,
      deps: [InitService],
      multi: true,
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'fill' },
    },
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
