import { Component } from '@angular/core';

import { XrmContext, XrmEntityKey, XrmQueryResult, XrmContextService, Entity, EntityReference, Condition, Operator, Comparator } from 'kipon-xrmservice';

export class CtxAccount extends Entity {
    constructor() {
        super("accounts", "accountid", true);
    }

    accountnumber: string = null;
    accountratingcode: string = null;
    name: string = null;
    lastonholdtime: Date = new Date();
    donotemail: boolean = null;

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
    parentcustomerid: EntityReference = new EntityReference().meta("accounts","parentcustomerid_account@odata.bind");

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
    currentContact: CtxContact;
    editCurrentName: string;

    contactResult: XrmQueryResult<CtxContact>;
    newContact: string;

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

    delete(con: CtxContact): void {
        let me = this;
        this.xrmContextService.delete(con).subscribe(r => {
            me.getContacts();
        });
    }

    click(con: CtxContact) {
        this.currentContact = con;
        this.editCurrentName = con.fullname;
    }

    create(): void {
        let me = this;
        if (this.newContact != null && this.newContact != '') {
            let spl = this.newContact.split(' ');
            if (spl.length == 2) {
                let con = new CtxContact();
                con.firstname = spl[0];
                con.lastname = spl[1];
                con.parentcustomerid = new EntityReference(this.account.id);

                this.xrmContextService.create<CtxContact>(this.contactPrototype, con).subscribe(r => {
                    me.getContacts();
                    me.newContact = null;
                });
            }
        }
    }

    update() {
        let me = this;
        if (this.currentContact != null && this.editCurrentName != null && this.editCurrentName != '') {
            let spl = this.editCurrentName.split(' ');
            if (spl.length == 2) {
                this.currentContact.firstname = spl[0];
                this.currentContact.lastname = spl[1];
                this.xrmContextService.update<CtxContact>(this.contactPrototype, this.currentContact).subscribe(r => {
                    me.getContacts();
                });
            }
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
