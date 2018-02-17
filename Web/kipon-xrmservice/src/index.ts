import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import 'rxjs/Rx';
import { _throw } from 'rxjs/observable/throw';
import 'rxjs/add/operator/catch';


import { XrmInterceptor } from './xrm.interceptor';
import { XrmStateService } from './xrmstate.service';

import { XrmService, XrmContext } from './xrm.service';
import { XrmContextService } from './xrmcontext.service';
import { MetadataService } from './metadata.service';

export * from './xrm.interceptor';
export * from './xrmstate.service';
export * from './xrm.service';
export * from './xrmcontext.service';
export * from './metadata.service';

@NgModule({
    imports: [
        CommonModule,
        HttpClientModule
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
            providers: [XrmStateService, XrmService, XrmContextService, MetadataService]
        };
    }
}
