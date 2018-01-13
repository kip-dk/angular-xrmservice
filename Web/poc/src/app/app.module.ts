import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { XrmServiceModule, XrmService, XrmContextService } from 'kipon-xrmservice';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
      BrowserModule,
      FormsModule,
      XrmServiceModule
  ],
  providers: [XrmService, XrmContextService],
  bootstrap: [AppComponent]
})
export class AppModule { }
