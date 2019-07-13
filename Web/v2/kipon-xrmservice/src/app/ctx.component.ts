import { Component, OnInit } from '@angular/core';

import { XrmStateService, XrmService, XrmContext, XrmEntityKey, XrmQueryResult, Expand, XrmContextService, Entity, Entities, EntityReference, OptionSetValue, Condition, Operator, Comparator, XrmTransaction, XrmAccess, XrmAnnotationService, Annotation } from 'kipon-xrmservice';


export class List extends Entity {
  constructor() {
    super('lists', 'listid', true);
  }
  listname: string = null;

  meta(): List {
    return this;
  }
}

export class CtxAccount extends Entity {
  constructor() {
    super("accounts", "accountid", true);
  }

  accountnumber: string = null;
  accountratingcode: string = null;
  name: string = null;
  lastonholdtime: Date = new Date();
  donotemail: boolean = null;
  creditlimit: number = null;
  transactioncurrencyid: EntityReference = new EntityReference().meta("transactioncurrencies", "transactioncurrencyid@odata.bind");
  industrycode: OptionSetValue = new OptionSetValue();
  primarycontactid: CtxContact = new CtxContact();

  ignoreMe: string;

  onFetch(): void {
    this.ignoreMe = 'ignore me was initialized by onFetch';
  }

  access: XrmAccess = new XrmAccess();

  meta(): CtxAccount {
    return this;
  }
}

export class CtxOpportunity extends Entity {
  constructor() {
    super('opportunities', 'opportunityid', true);
  }
  name: string = null;
  customerid: EntityReference = new EntityReference().meta("contacts", "customerid_contact");

  opportunitycompetitors_association: Entities<CtxCompetitor>;

  meta(): CtxOpportunity {
    this.opportunitycompetitors_association = new Entities<CtxCompetitor>("opportunities", "competitors", "opportunitycompetitors_association", true, new CtxCompetitor().meta());
    return this;
  }

  hasCompetitor(com: CtxCompetitor) {
    return this.opportunitycompetitors_association != null && this.opportunitycompetitors_association.find(r => r.id == com.id) != null;
  }
}

export class CtxCompetitor extends Entity {
  constructor() {
    super('competitors', 'competitorid', true);
  }
  name: string = null;

  meta(): CtxCompetitor {
    return this;
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
  parentcustomerid: EntityReference = new EntityReference().meta("accounts", "parentcustomerid_account@odata.bind");

  server_fullname: string;
  views: number;
  checked: boolean;

  listcontact_association: List[];
  parentcustomerid_account: CtxAccount;

  opportunities: CtxOpportunity[];

  access: XrmAccess = new XrmAccess(true);

  onFetch(): void {
    this.server_fullname = this.fullname;
    if (this.views == null) {
      this.views = 1;
    } else {
      this.views++;
    }
    if (this.checked == null) this.checked = false;
  }

  meta(): CtxContact {
    this.listcontact_association = [new List().meta()];
    this.parentcustomerid_account = new CtxAccount();
    return this;
  }

  nextname: string;
}

class industry {
  constructor(value: number, name: string) {
    this.value = value;
    this.name = name;
  }

  value: number;
  name: string;
}

class User {
  BusinessUnitId: string;
  OrganizationId: string;
  UserId: string;
}


class Address {
  Line1: string;
  City: string;
  StateOrProvince: string;
  PostalCode: string;
  Country: string;
}

class FormatedAddress {
  Address: string;
}

@Component({
  selector: 'ctx',
  templateUrl: './ctx.component.html'
})
export class CtxComponent implements OnInit {
  private accountPrototype = new CtxAccount().meta();
  private contactPrototype = new CtxContact().meta();
  private opportunityPrototype = new CtxOpportunity().meta();
  private competitorPrototype = new CtxCompetitor().meta();

  currentuserid: string = null;
  account: CtxAccount;
  contacts: CtxContact[];
  currentContact: CtxContact;
  editCurrentName: string;
  competitors: CtxCompetitor[];

  contactResult: XrmQueryResult<CtxContact>;
  newContact: string;

  newDate: string;

  hasNextName: boolean = false;

  notes: Annotation[];
  nextnote: string;

  industries: industry[] = [
    new industry(1, "Accounting"),
    new industry(2, "Agriculture and Non-petrol Natural Resource Extraction"),
    new industry(3, "Broadcasting Printing and Publishing"),
    new industry(4, "Brokers"),
    new industry(5, "Building Supply Retail")
  ];

  constructor(private xrmContextService: XrmContextService, private xrmService: XrmService, public xrmState: XrmStateService, private annoService: XrmAnnotationService) {
    this.xrmContextService.getCurrentUserId().toPromise().then(r => {
      this.currentuserid = r;
    });
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

      me.xrmContextService.query(me.competitorPrototype, null).subscribe(r => {
        me.competitors = r.value;
      });

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

    this.annoService.related(con).subscribe(r => {
      this.notes = r.value;
    });
  }

  addNote(): void {
    console.log('add note: ' + this.nextnote);
    if (this.nextnote != null && this.nextnote != '') {
      this.annoService.add(this.currentContact, this.nextnote, null).subscribe(r => {
        this.nextnote = null;
        this.click(this.currentContact);
      });
    }
  }

  deleteNote(note: Annotation): void {
    this.annoService.delete(note).subscribe(r => {
      this.click(this.currentContact);
    });
  }

  updateNote(note: Annotation): void {
    this.annoService.update(note).subscribe(r => {
      this.click(this.currentContact);
    });
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

  createTwo(): void {
    let me = this;
    if (this.newContact != null && this.newContact != '') {
      let spl = this.newContact.split(' ');
      if (spl.length == 2) {
        let all = [];
        let count = 1;

        for (let i = 0; i < 2; i++) {
          let con = new CtxContact();
          con.firstname = spl[0] + count;
          con.lastname = spl[1] + count;
          con.parentcustomerid = new EntityReference(this.account.id);
          all.push(con);
          count++;
        }

        this.xrmContextService.createAll(this.contactPrototype, all).subscribe(r => {
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
        });
      }
    }
  }

  updateDate() {
    if (this.newDate != null && this.newDate != '') {
      this.account.lastonholdtime = new Date(Date.parse(this.newDate));
      this.updateAccount();
    }
  }

  setIndustry(id: industry) {
    this.account.industrycode = new OptionSetValue(id.value);
    this.updateAccount();
  }

  updateAccount() {
    this.xrmContextService.update<CtxAccount>(this.accountPrototype, this.account).subscribe(r => {
      this.newDate = null;
    });
  }

  deleteSelected() {
    let r: CtxContact[] = this.contacts.filter(r => r.checked);
    this.xrmContextService.deleteAll(r).subscribe(a => {
      this.getContacts();
    });
  }

  checked(): number {
    if (this.contacts != null && this.contacts.length > 0) {
      return this.contacts.filter(r => r.checked).length;
    }
    return 0;
  }

  resolveAccess(con: CtxContact) {
    this.xrmContextService.applyAccess(this.contactPrototype, con).subscribe(r => {
    });
  }

  resolveList(con: CtxContact) {
    this.xrmContextService.get(this.contactPrototype, con.id).subscribe(r => {
      console.log(r);
    });
  }

  resolveOpportunities(con: CtxContact) {
    if (con.opportunities == null) {
      var condition = new Condition().where("customerid", Comparator.Equals, con.id);
      this.xrmContextService.query(this.opportunityPrototype, condition).subscribe(r => {
        con.opportunities = r.value;
      });
    }
  }

  resolveCompetitors(opp: CtxOpportunity) {
    if (opp.opportunitycompetitors_association == null) {
      this.xrmContextService.get(this.opportunityPrototype, opp.id).subscribe(r => {
        console.log(r);
      });
    }
  }

  disassociate(opp: CtxOpportunity, com: CtxCompetitor) {
    opp.opportunitycompetitors_association.remove(com).subscribe(r => { });
  }

  associate(opp: CtxOpportunity, com: CtxCompetitor) {
    opp.opportunitycompetitors_association.add(com).subscribe(r => { });
  }

  nextNameChanged() {
    this.hasNextName = false;
    this.contacts.forEach(c => {
      if (c.nextname != null && c.nextname.split(' ').length == 2) {
        this.hasNextName = true;
      }
    });
  }

  saveNextName() {
    let trans = new XrmTransaction();
    this.contacts.forEach(c => {
      if (c.nextname != null) {
        var spl = c.nextname.split(' ');
        if (spl.length == 2) {
          c.firstname = spl[0];
          c.lastname = spl[1];
          trans.update(this.contactPrototype, c);
        }
      }
    });
    this.xrmContextService.commit(trans).subscribe(r => {
      this.contacts.forEach(c => {
        c.server_fullname = c.nextname;
        c.nextname = null;
      });
      this.nextNameChanged();
    });
  }

  // Test parameter less functions
  testWhoAmI(): void {
    this.xrmContextService["func"]("WhoAmI", null).toPromise().then(r => {
      var result = r as User;
      alert("UserId: " + result.UserId + " OrgId:" + result.OrganizationId + " BU:" + result.BusinessUnitId);
    });
  }


  // time zone test from article
  testTimezone(): void {
    var data = {
      LocalizedStandardName: "Pacific Standard Time",
      localeId: 1033
    }
    this.xrmContextService["func"]("GetTimeZoneCodeByLocalizedName", data).toPromise().then(r => {
      console.log(r);
    });
  }

  // more complex parameter test
  address: Address = {
    Line1: "Carl møllers alle 38",
    PostalCode: "2860",
    City: "Søborg",
    Country: "Denmark",
    StateOrProvince: ""
  }

  // Test function with simple parameters
  testFormatAddress(): void {
    this.xrmContextService["func"]("Microsoft.Dynamics.CRM.FormatAddress", this.address).toPromise().then(r => {
      var result = r as FormatedAddress;
      alert(result.Address);
    });
  }


  private getContacts() {
    let me = this;

    if (this.account != null) {
      let c = new Condition()
        .where("parentcustomerid", Comparator.Equals, new EntityReference(me.account.id))
        .where("createdon", Comparator.LessThanOrEQual, new Date());
      me.xrmContextService.query<CtxContact>(me.contactPrototype, c, "fullname", 4, true).toPromise().then(r => {
        me.contacts = r.value;
        me.contactResult = r;
      });
    }
  }
}
