import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { XrmQueryResult, XrmContextService, Entity, Entities, EntityReference, OptionSetValue, Condition, Operator, Comparator } from 'kipon-xrmservice';


export class Account extends Entity {
  constructor() {
    super('accounts', 'accountid', false);
  }
  accountnumber: string = null;

  meta(): Account {
    return this;
  }

  onFetch(prototype: Account): void {
    console.log('hello from account service for account:' + this.id);
  }
}

@Injectable()
export class AccountService {
  localPrototype: Account = new Account().meta();

  constructor(private xrmService: XrmContextService) {
    //this.localPrototype.onFetch();
  }

  query(): Observable<XrmQueryResult<Account>> {

    if (this.localPrototype["onFetch"] != null) {
      this.localPrototype["onFetch"](this.localPrototype);
    }

    var names = Object.getOwnPropertyNames(Object.getPrototypeOf(this.localPrototype));
    names.forEach(r => {
      console.log('name: ' + r);
    });

    var x = this.localPrototype["onFetch"];
    console.log(x);

    let condition: Condition = new Condition().isActive();

    console.log(this.localPrototype);
    return this.xrmService.query<Account>(this.localPrototype, condition);
  }
}
