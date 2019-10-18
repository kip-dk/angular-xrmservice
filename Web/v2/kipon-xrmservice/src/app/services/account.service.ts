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
  onFetch(): void {
    console.log('hello from account service for account:' + this.id);
  }
}

@Injectable()
export class AccountService {
  localPrototype: Account = new Account().meta();
  constructor(private xrmService: XrmContextService) { }

  query(): Observable<XrmQueryResult<Account>> {
    let condition: Condition = new Condition().isActive();
    return this.xrmService.query<Account>(this.localPrototype, condition);
  }
}
