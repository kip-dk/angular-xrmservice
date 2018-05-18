import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { XrmServiceModule, XrmService, XrmContextService, MetadataService } from 'kipon-xrmservice';
import { KiponUIModule } from 'kipon-ui';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
      BrowserModule,
      FormsModule,
      XrmServiceModule,
      KiponUIModule
  ],
  providers: [XrmService, XrmContextService, MetadataService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
