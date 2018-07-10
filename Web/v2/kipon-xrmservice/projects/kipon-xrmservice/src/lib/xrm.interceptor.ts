import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse, HttpErrorResponse } from '@angular/common/http';

import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators'

import { XrmStateService } from './xrmstate.service';


@Injectable()
export class XrmInterceptor implements HttpInterceptor {
  private nextNumber: number = 0;
  constructor(private xrmState: XrmStateService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    this.nextNumber++;
    let me = this.nextNumber;
    this.xrmState['add'](me);

    return next.handle(req)
      .pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          this.xrmState['remove'](me, false);
        }
        return event;
      }),
      catchError(error  => {
        this.xrmState['remove'](me, true);
        return error;
      })
    );
  }
}
