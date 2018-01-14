import { Component } from '@angular/core';

import { XrmContext, XrmEntityKey, XrmQueryResult, XrmContextService, Entity, EntityReference } from 'kipon-xrmservice';

export class CtxAccount extends Entity {
    constructor() {
        super("accounts", "accountid");
    }

    accountnumber: string = null;
    accountratingcode: string = null;
    name: string = null;

    ignoreMe: string;

    onFetch(): void {
        this.ignoreMe = 'ignore me was initialized by onFetch';
    }
}



@Component({
    selector: 'ctx',
    templateUrl: './ctx.component.html'
})
export class CtxComponent {
    private accountPrototype = new CtxAccount();
    private account: CtxAccount;

    constructor(private xrmContextService: XrmContextService) {
    }

    ngOnInit() {
        let me = this;
        this.xrmContextService.getCurrentKey().subscribe(r => {
            if (r.id != null && r.id != '') {
                me.xrmContextService.get<CtxAccount>(me.accountPrototype, r.id, false).subscribe(a => {
                    console.log(a);
                    me.account = a;
                });
            };
        });
    }

}
