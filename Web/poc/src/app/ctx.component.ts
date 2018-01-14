import { Component } from '@angular/core';

import { XrmContext, XrmEntityKey, XrmQueryResult, XrmContextService, Entity, EntityReference, Condition, Operator, Comparator } from 'kipon-xrmservice';

export class CtxAccount extends Entity {
    constructor() {
        super("accounts", "accountid", false);
    }

    accountnumber: string = null;
    accountratingcode: string = null;
    name: string = null;

    ignoreMe: string;

    onFetch(): void {
        this.ignoreMe = 'ignore me was initialized by onFetch';
    }
}

export class CtxContact extends Entity {
    constructor() {
        super("contacts", "contactid", true);
    }

    fullname: string = null;
    firstname: string = null;
    lastname: string = null;
    address1_line1: string = null;
    parentcustomerid: EntityReference = new EntityReference();

    server_fullname: string;
    views: number;

    onFetch(): void {
        this.server_fullname = this.fullname;
        if (this.views == null) {
            this.views = 1;
        } else {
            this.views++;
        }
    }
}




@Component({
    selector: 'ctx',
    templateUrl: './ctx.component.html'
})
export class CtxComponent {
    private accountPrototype = new CtxAccount();
    private contactPrototype = new CtxContact();

    account: CtxAccount;
    contacts: CtxContact[];
    contactResult: XrmQueryResult<CtxContact>; 

    constructor(private xrmContextService: XrmContextService) {
    }

    ngOnInit() {
        let me = this;
        this.xrmContextService.getCurrentKey().subscribe(r => {
            if (r.id != null && r.id != '') {
                me.xrmContextService.get<CtxAccount>(me.accountPrototype, r.id).subscribe(a => {
                    me.account = a;
                    me.getContacts();
                });
            };
        });
    }

    prev() {
        let me = this;
        if (this.contactResult != null && this.contactResult.prev != null) {
            this.contactResult.prev().subscribe(r => {
                me.contacts = r.value;
                me.contactResult = r;
            });
        }
    }

    next() {
        let me = this;
        if (this.contactResult != null && this.contactResult.next != null) {
            this.contactResult.next().subscribe(r => {
                me.contacts = r.value;
                me.contactResult = r;
            });
        }
    }


    private getContacts() {
        let me = this;

        if (this.account != null) {
            let c = new Condition().where("parentcustomerid", Comparator.Equals, new EntityReference(me.account.id));
            me.xrmContextService.query<CtxContact>(me.contactPrototype, c, "fullname", 2, true).subscribe(r => {
                me.contacts = r.value;
                me.contactResult = r;
            });
        }
    }
}
