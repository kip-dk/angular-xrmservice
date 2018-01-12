import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { XrmServiceModule, XrmService } from 'kipon-xrmservice';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
      BrowserModule,
      FormsModule,
      XrmServiceModule
  ],
  providers: [XrmService],
  bootstrap: [AppComponent]
})
export class AppModule { }
