import { Component } from '@angular/core';

import { XrmService, XrmContext } from 'kipon-xrmservice';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'app'
    ctx: XrmContext;
    url: string;


    constructor(private xrmService: XrmService) {
        this.ctx = xrmService.getContext();
        this.url = this.ctx.getClientUrl();
  }
}
