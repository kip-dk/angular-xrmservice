import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { HTTP_INTERCEPTORS } from '@angular/common/http';


import { AppComponent } from './app.component';
import { CtxComponent } from './ctx.component';

import { XrmServiceModule, XrmStateService, XrmService, XrmContextService, XrmInterceptor } from './xrm/index'

@NgModule({
  declarations: [
    AppComponent,
    CtxComponent
  ],
  imports: [
      BrowserModule,
      FormsModule,
      XrmServiceModule
  ],
  providers: [
      XrmStateService,
      XrmService,
      XrmContextService,
      { provide: HTTP_INTERCEPTORS, useClass: XrmInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
