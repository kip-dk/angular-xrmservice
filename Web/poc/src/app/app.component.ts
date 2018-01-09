import { Component } from '@angular/core';

import { XrmService, XrmContext } from 'kipon-xrmservice';


export class Account {
    accountid: string;
    accountnumber: string;
    accountratingcode: string;
    name: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'app'
    ctx: XrmContext;
    url: string;
    account: Account;


    constructor(private xrmService: XrmService) {
        this.ctx = xrmService.getContext();
        this.url = this.ctx.getClientUrl();
    }

    ngOnInit() {
        this.xrmService.get<Account>("accounts", "C54BEC0B-B543-E711-A962-000D3A27D441", "accountid,accountnumber,accountratingcode,name").subscribe(r => {
            this.account = r;
        });
    }
}
