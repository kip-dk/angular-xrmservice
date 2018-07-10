import { Component } from '@angular/core';

import { XrmService, XrmContext, XrmEntityKey, XrmQueryResult, Expand, XrmContextService } from 'kipon-xrmservice';

export class Account {
    accountid: string;
    accountnumber: string;
    accountratingcode: string;
    name: string;
    primarycontactid: Contact;
}

export class Contact {
    contactid: string;
    fullname: string;
    server_fullname: string;
    firstname: string;
    lastname: string;
    address1_line1: string;
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
    contact: Contact;
    countContacts: number;
    lastContactResult: XrmQueryResult<Contact>;

    newContact: string;

    key: XrmEntityKey;

    testparam: string;


    constructor(private xrmService: XrmService, private contextService: XrmContextService) {
        this.xrmService.debug = false;
        this.ctx = xrmService.getContext();
        this.url = this.ctx.getClientUrl();
    }

    // "C54BEC0B-B543-E711-A962-000D3A27D441"

    ngOnInit() {
      let me = this;
      this.testparam = this.xrmService.getParameter('testparam');
        this.xrmService.getCurrenKey().subscribe(r => {
            if (r.id != null && r.entityType === 'account') {
                let expand = new Expand();
                expand.name = "primarycontactid";
                expand.select = "fullname,firstname,lastname,address1_line1"
                this.xrmService.get<Account>("accounts", r.id, "accountid,accountnumber,accountratingcode,name", expand).subscribe(r => {
                    this.account = r;
                    me.getContacts();
                });
            }
        });
    }

    createNew() {
        let me = this;
        if (this.newContact != null && this.newContact != '') {
            let vals = this.newContact.split(' ');
            if (vals.length == 2) {
                let con = new Contact();
                con.firstname = vals[0];
                con.lastname = vals[1];
                con["parentcustomerid_account@odata.bind"] = '/accounts(' + me.account.accountid + ')';

                this.xrmService.create('contacts', con).subscribe(r => {
                    me.newContact = null;
                    me.getContacts();
                });
            }
        }
    }
    update() {
        let me = this;
        if (this.contact != null && this.contact.fullname != null) {
            let vals = this.contact.fullname.split(' ');
            if (vals.length == 2) {
                let con = new Contact();
                con.firstname = vals[0];
                con.lastname = vals[1];
                this.xrmService.update('contacts', con, this.contact.contactid).subscribe(r => {
                    this.contact = null;
                    this.getContacts();
                });
            }
        }
    }

    updateAddress() {
        let me = this;
        this.xrmService.put("contacts", this.contact.contactid, "address1_line1", this.contact.address1_line1).subscribe(r => {
            me.getContacts();
        });
    }

    select(con: Contact) {
        this.contact = con;
    }

    delete(con: Contact) {
        let me = this;
        this.xrmService.delete("contacts", con.contactid).subscribe(r => {
            me.getContacts();
            me.contact = null;
        });
    }

    prev() {
        let me = this;
        if (this.lastContactResult != null && this.lastContactResult.prev != null) {
            this.lastContactResult.prev().subscribe(r => {
                me.lastContactResult = r;
                me.contacts = r.value;
                me.countContacts = r.count;
                me.contacts.forEach(r => {
                    r.server_fullname = r.fullname;
                });
            });
        }
    }


    next() {
        let me = this;
        if (this.lastContactResult != null && this.lastContactResult.next != null) {
            this.lastContactResult.next().subscribe(r => {
                me.lastContactResult = r;
                me.contacts = r.value;
                me.countContacts = r.count;
                me.contacts.forEach(r => {
                    r.server_fullname = r.fullname;
                });
            });
        }
    }

    private getContacts() {
        let me = this;
        if (this.account != null) {
            this.xrmService.query<Contact>(
                "contacts",
                "contactid,_accountid_value,fullname,_parentcustomerid_value,address1_line1", "_parentcustomerid_value eq " + this.account.accountid,
                "fullname",
                2,
                true
            ).subscribe(r => {
                me.lastContactResult = r;
                me.contacts = r.value;
                me.countContacts = r.count;
                me.contacts.forEach(r => {
                    r.server_fullname = r.fullname;
                });
            });
        } else {
            me.contacts = null;
        }
    }
}
