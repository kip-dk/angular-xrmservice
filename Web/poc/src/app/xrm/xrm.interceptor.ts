import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse, HttpErrorResponse } from '@angular/common/http';

import { _throw } from 'rxjs/observable/throw';
import 'rxjs/add/operator/catch';

import { Observable } from 'rxjs/observable';
import { XrmStateService } from './xrmstate.service';


@Injectable()
export class XrmInterceptor implements HttpInterceptor {
    private nextNumber: number = 0;
    constructor(private xrmState: XrmStateService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        this.nextNumber++;
        let me = this.nextNumber;
        this.xrmState['add'](me);
        return next.handle(req)
            .map((event: HttpEvent<any>) => {
                if (event instanceof HttpResponse) {
                    this.xrmState['remove'](me, false);
                }
                return event;
            })
            .catch((err: HttpErrorResponse) => {
                this.xrmState['remove'](me, true);
                return _throw(err);
            });
    }
}