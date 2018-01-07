import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { XrmService } from './xrm.service';

export * from './xrm.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
  ],
  exports: [
  ]
})
export class XrmServiceModule {
  static forRoot(): ModuleWithProviders {
    return {
        ngModule: XrmServiceModule,
      providers: [XrmService]
    };
  }
}
