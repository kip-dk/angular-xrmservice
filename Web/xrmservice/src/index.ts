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
export class SampleModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SampleModule,
      providers: [XrmService]
    };
  }
}
