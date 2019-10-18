import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule, APP_INITIALIZER } from '@angular/core';

import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { KiponXrmserviceModule, XrmInterceptor, KiponXrmSecurityModule } from 'kipon-xrmservice';

import { AccountService } from './services/account.service';

import { AppComponent } from './app.component';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    KiponXrmserviceModule,
    KiponXrmSecurityModule
  ],
  providers: [
    AccountService,
    { provide: HTTP_INTERCEPTORS, useClass: XrmInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
