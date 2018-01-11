import { Component } from '@angular/core';

import { XrmService, XrmContext, XrmEntityKey } from 'kipon-xrmservice';


export class Account {
    accountid: string;
    accountnumber: string;
    accountratingcode: string;
    name: string;
}

export class Contact {
    fullname: string;
    _parentcustomerid_value: string;
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
    contacts: Contact[];

    key: XrmEntityKey;


    constructor(private xrmService: XrmService) {
        this.ctx = xrmService.getContext();
        this.url = this.ctx.getClientUrl();
    }

    // "C54BEC0B-B543-E711-A962-000D3A27D441"

    ngOnInit() {
        let me = this;
        this.xrmService.getCurrenKey().subscribe(r => {
            if (r.id != null && r.entityType === 'account') {
                this.xrmService.get<Account>("accounts", r.id, "accountid,accountnumber,accountratingcode,name").subscribe(r => {
                    this.account = r;
                });

                this.xrmService.query<Contact>("contacts", "_accountid_value,fullname,_parentcustomerid_value", "_parentcustomerid_value eq " + r.id).subscribe(r => {
                    me.contacts = r.value;
                });
            }
        });
    }
}
