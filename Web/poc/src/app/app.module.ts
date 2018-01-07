import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { XrmServiceModule, XrmService } from 'kipon-xrmservice';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
      BrowserModule,
      XrmServiceModule
  ],
  providers: [XrmService],
  bootstrap: [AppComponent]
})
export class AppModule { }
