# XrmContextService

The XrmContextService is build on top of the XrmService, but allow a more simple programming model, where you define your queries
by defining object prototypes that reflects the properties of the corresponding Dynamics 365 entities. 

XrmContextService also behave as a context for the Dynamics 365, chaching the objects fetched by get or query within the context, and ensure that you 
always get the same object instance back from a server, if it is fetch several times. As an example, lets say you fetch an account, and is primary contact
in one query, and in next query, you fetch all child contacts of the same account. Now, if the primary contact of the account has this account as
parent account, you will actually get two different objects back from the server representing the primary contact. 
The XrmServiceContext ensure that these two instance are merged into a simgle instance on the client, so you only have one instance of the object, 
even though it has been fetch twise by two difference api calls.

This is	quite powerfull, especially if you create UI that allow changes to the object, because you will not need to do anything to keep content of
the two instance in sync.

If this sound to much for you, and what you need is a more plain service, you can go back to the XrmService and settle with the simplicity of that cat.
[Go to documentation page for the XrmService](README.MD)

## Installation

To install this library, run:

```bash
$ npm install kipon-xrmservice --save
```

The XrmContextService is part of the same module as xrmservice, but you need to include it explicitly in your module.
Because XrmContextService is using XrmService under the hood, you need to import both services in you application.

Include the XrmServiceModule, XrmService and XrmContextService in your `AppModule`:

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

// Import your library
import { XrmServiceModule, XrmService, XrmContextService } from 'kipon-xrmservice';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
	XrmServiceModule
  ],
  providers: [ XrmService, XrmContextService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## Methods inherited from XrmService

Look in the api for XrmService for the following methods. There are in the XrmContextService for your convinience only, so you only need to inject
the XrmContextService into your custom services:

xrmContextService.setVersion(v:string)
xrmContextService.getContext()
xrmService.getCurrenKey(): Observable&lt;XrmEntityKey&gt;


## The XrmContextService programming model
The XrmContextService is based on prototyping your Dynamics 365 object model. This means that, instead of parsing a comma separated list of strings, representing
fields names of an entity, you simply parse and instance of a prototype, and the XrmContextService will use that object to build the corresponding Web API call.

Take a look at below service implementation, using the XrmContextService:


```typescript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { XrmQueryResult, XrmContextService, Entity, EntityReference, OptionSetValue, Condition, Operator, Comparator } from 'kipon-xrmservice';

export class Account extends Entity {
	constructor() {
		super('accounts','accountid', true);
	}
	accountnumber: string = null;
	address1_city: string = null;
	creditlimit: number = null;
	creditonhold: boolean = null;
	industrycode: OptionSetValue = new OptionSetValue();
	lastonholdtime: Date = new Date();
	name: string = null;
	primarycontactid: EntityReference = new EntityReference("contacts","primarycontactid");
}

@Injectable()
export class AccountService {
	private localPrototype: Account = new Account();
	constructor(private xrmContext: XrmContextService) { }

	get(id:string): Observable<Account> {
		return this.xrmService.get<Account>(this.localPrototype, id);
	}

	query(search:string): Observable<XrmQueryResult<Account[]>>) {
		let condition: Condition = new Condition().where('name', Comparator.Contains, search);
		return this.xrmService.query<XrmQueryResult<Account[]>>(this.localPrototype, condition);
	}

	create(instance: Account): Observable<Account> {
		return this.xrmService.create<Account>(this.localPrototype, instance);
	}

	update(instance: Account): Observable<Account> {
		return this.xrmService.update<Account>(this.localPrototype, instance);
	}

	delete(instance: Account): Observable<null> {
		return this.xrmService.delete(instance);
	}
}
```

The above example service show a full running service with support for all CRUD operations. 
The query is defined by the class Account, that extends Entity.

The constructor is overridden, and must parse the plural name and the entity key name, and finally an optional boolean, indicating if update
operations is needed. Default is false, but then the XrmContextService will throw an exception if you try of perform an update operation
on the entity. The reason you need to decided this, is that all objects will be changed managed by the XrmContextService, and if this is not 
needed in your application, it has a performance penelty, because the XrmContextService is managing changes in each object my doing a property clone on all
operations, returning an object instance from the server.

The property names must correspond 100% to the logical attribute name, and properties that should be included in any operation (get, query, update, create) must be set
with an initial value in the prototype. For string and numbers, null is sufficient, but if you wish to work with stronly typed objects supported in the model, such
property must be assigned a strong type value. This value will NOT serve as a default when data is fetched by get or query method, but it will help the XrmContextService
to build the needed web API urls, and secondly automatically convert the returned values from the server to strongly typed properties.


### The folloing strong types are supported

#### string = single line text, or memo
#### number = whole number, decimal and money
#### Date = standard javascript Date object.
#### boolean = two option field
#### OptionSetValue = { value: number, name: string }, representing a Picklist value from Dynamics 365
#### EntityReference 
A reference to a related entity on the form { id: string, name: string }
When used in a prototype, you state that you wish the XrmContextService to convert realted enttiy references to an EntityReference, instead of
working with the @odata properties representing a lookup field in the Web API.

An EntityReference must be defined in the prototype with needed metadata settings to allow the XrmContextService to resolve Web API correctly.
In above example, we state that the primarycontactid is referencing contacts, and the schema name for the navigation property is primarycontactid.

## CRUD operations


