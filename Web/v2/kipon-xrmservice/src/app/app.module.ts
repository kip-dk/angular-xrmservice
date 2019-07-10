import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule, APP_INITIALIZER } from '@angular/core';

import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { KiponXrmserviceModule, XrmInterceptor, KiponXrmSecurityModule, KiponXrmAnnotationModule, KiponXrmMetadataModule } from 'kipon-xrmservice';

import { AppComponent } from './app.component';
import { CtxComponent } from './ctx.component';
import { AccessViewComponent } from './accessView.component';
import { MetadataComponent } from './metadata.component';

@NgModule({
  declarations: [
    AppComponent,
    CtxComponent,
    AccessViewComponent,
    MetadataComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    KiponXrmserviceModule,
    KiponXrmSecurityModule,
    KiponXrmAnnotationModule,
    KiponXrmMetadataModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: XrmInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
