import { NgModule } from '@angular/core';

import { HttpClientModule, HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators'

import { XrmAuthService } from './auth.service';
import { XrmInterceptor } from './xrm.interceptor';
import { XrmService } from './xrm.service';
import { XrmContextService } from './xrmcontext.service';
import { XrmStateService } from './xrmstate.service';
import { XrmConfigService } from './xrmconfig.service';

@NgModule({
  imports: [
    HttpClientModule
  ],
  declarations: [],
  exports: [],
  providers: [
    XrmAuthService,
    XrmService,
    XrmContextService,
    XrmStateService,
    XrmConfigService
  ]
})
export class KiponXrmserviceModule { }
