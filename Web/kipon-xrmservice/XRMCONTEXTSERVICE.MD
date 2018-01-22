# XrmContextService

The XrmContextService is build on top of the XrmService, but allow a simple yet powerfull programming model, where you define your queries
by defining object prototypes that reflects the properties of the corresponding Dynamics 365 entities. 

XrmContextService also behave as a context for the Dynamics 365, caching the objects fetched by get or query within the context, and ensure that you 
always get the same object instance back from a api call, if it has already been fetch by another call. 
As an example, lets say you fetch an account, and its primary contact in one query, and in next query, you fetch all child contacts of the same account. 
Now, if the primary contact of the account has this account as parent account, you will actually get two different objects back from the server representing 
the primary contact. 
The XrmServiceContext ensure that these two instance are merged into a single instance on the client, so you only have one instance of the object, 
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

The XrmContextService is part of the same module as xrmservice, but you need to include it explicitly in your angular module.
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
Look in the api for XrmService for the following methods. They are in the XrmContextService for your convinience only, so you only need to inject
the XrmContextService into your custom services:<br /><br />

xrmContextService.setVersion(v:string)<br />
xrmContextService.getContext()<br />
xrmService.getCurrenKey(): Observable&lt;XrmEntityKey&gt;<br />


## The XrmContextService programming model
The XrmContextService is based on prototyping your Dynamics 365 object model. This means that, instead of parsing a comma separated list of strings, representing
fields names of an entity, you simply parse and instance of a prototype, and the XrmContextService will use that object to build the corresponding Web API call.<br />
<br />
Take a look at below service implementation, using the XrmContextService:<br />

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

As you can see from the Account prototype, the accountid field is not included as a property on the class, but instead parsed to the constructor super method.
This is because the XrmContextService is simplifying unique key management, by always naming the unique key of an object "id", and id is a property on the Entity
class. Any opeation, get, query and create, will assign the id of the returned instance, according to the key name, and it will explcitly remove the original key field
from the instance. This is because it is so much easier to create generic code for CRUD operation when you always know the name of the field representing the unique key.

The constructor is overridden, and must parse the plural name and the entity key name, and finally an optional boolean, indicating if update
operations is needed. Default is false, but then the XrmContextService will throw an exception if you try of perform an update operation
on the entity. The reason you need to decided this, is that all objects will be changed managed by the XrmContextService, and if this is not 
needed in your application, it has a performance penelty, because the XrmContextService is managing changes in each object my doing a property clone on all
operations, returning an object instance from the server.

The property names must correspond 100% to the logical attribute name, and properties that should be included in any operation (get, query, update, create) must be set
with an initial value in the prototype. For string, boolean and number, null is sufficient, but if you wish to work with stronly typed objects supported in the model, such
property must be assigned a strong type value. This value will NOT serve as a default when data is fetched by get or query method, but it will help the XrmContextService
to build the needed web API urls, and secondly automatically convert the returned values from the server to strongly typed properties in the result object.

Be aware, if you use the strong type objects, Date, OptionSetValue or EntityReference, you need to do so, both in your prototype, and when you assign values to an
instance with the purpose of doing an update or a create. The XrmContextService will map the properties to correct format and naming when building the get, query, update
and create statements.

### The following strong types are supported

#### string = single line text, or memo
#### number = whole number, decimal and money
#### boolean = two option field
#### Date = standard javascript Date object.
#### OptionSetValue = { value: number, name: string }, representing a Picklist value from Dynamics 365
#### EntityReference 
A reference to a related entity on the form { id: string, name: string }
When used in a prototype, you state that you wish the XrmContextService to convert realted enttiy references to an EntityReference, instead of
working with the @odata properties representing a lookup field in the Web API.

An EntityReference must be defined in the prototype with needed metadata settings to allow the XrmContextService to resolve Web API correctly.
In above example, we state that the primarycontactid is referencing contacts, and the schema name for the navigation property is primarycontactid.

### Building a service based on XrmContextService

```typescript
@Injectable()
export class AccountService {
	private localPrototype: Account = new Account();
	constructor(private xrmContext: XrmContextService) { }
}
```
Above code shows the basic signature of a new service (from Dynamics 365 account entity). The first line in the code
defines a "localPrototype" instance of account. That instance will be used to parse to the CRU operations for the service. That way, you do not
need to parse strings telling the service what to fetch from the server. It can be derived from that prototype. You need to define all properties that
must be included in any get or fetch query, and you need to add all properties that can be subject to changes in your code.
<br />
Remember that all properties MUST have a value to be part of a get, query, update or create method call. The reason for this is explained later 
when we go into advanced use-cases for the entity prototype.

## CRUD operations

```typescript
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
```

As you can see, each method in the service parses the localProperty instance to the corresponding method in the XrmContextService. By defining
a specific entity service, you hide these dirty details from all other parts of your code, and your AccountService (or what ever entity you need to work on) 
becomes very simple and natural in its method signature.


## Advanced use-cases in your prototype object.
As stated, the prototype you defined is telling the XrmContextService what to fetch on get and query, and what to update on update, and what to parse to
new object create to the Dynamics 365 web api. Any property in prototype that has an assigned value in the prototype (null is ok for string, boolean and number) will be considered
an Dynamics 365 property, and the XrmContextService will add the property to get and query method, and it will perform change management on the property for update purpose,
and for create, a value assigned to a property on a real instance of the entity will be considered part of a potential create of the record.

### virtual properties
This pattern allow you to add virtual properties to the prototype that automatically will be excluded in any get, query, update, create statement.<br />
<br />
Lets look at an exampl:<br />
```typescript
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

	selected: boolean;
}
```

In above example, a "selected" property has been added to the prototype, but it has not been assigned any value. It can be used in the UI to mange if an instance
of an account ex. in a list has been selected. The UI can manipulate this setting, without impacting any update statement, and if an object is fetch several times,
these values will be retained due to the caching nature of the XrmContextService.

You can add any number of virtual properties to your prototype as long as you do not assign an initial value to the property.


### Instance methods
Because the prototype serves as a prototype for all methods getting data from Dynamics 365, you can also use the prototype to define methods for the object.

```typescript
export class Account extends Entity {
	constructor() {
		super('accounts','accountid', true);
	}
	...

	selected: boolean;

	creditColor(): string {
	   if (this.creditlimit > 0) return 'green';
	   if (this.creditlimit < 0) return 'red';
	   return 'yellow';
	}
}
```

In above example we define a function "creditColor" that will return a string value depeding on the creditlimit returned from the Dynamics 365 service.
Any function defined on the prototype will be added to each object, fetched from the server, regardles if the instance is fetch through get,query or create.
Since the update method of the XrmContextService only works for instances that was fetch through get,query or create, these instance will always have these methods
from the original method call.

### onFetch()
The constructor of your entity will NOT be called for instance commeing from the server as response to get or query. Any object put in the context, is initially the
the raw json object returned from these calles, however the XrmContextService will manipulate the returned object, but in terms of converting properties to
correct property type defined by the prototype, but also in terms of adding any methods, defined same place.

If you define a method in the prototype called "onFetch", this method will automatically be called by the XrmContextService after any fetch from the server and
before the result is parsed back to you. This allow you to do automatically initializtion of you object.

```typescript
export class Account extends Entity {
	constructor() {
		super('accounts','accountid', true);
	}
	...

	selected: boolean;

	onfetch(): string {
		if (this.selected == null) this.selected = false;
	}
}
```


### expand
Document how to define and expand property for get method.



## Inject your EntityService into a component and use it
Until now we have just defined a service that can perform CRUD operations against Dynamics 365. In this section we will explore around using the service in a component.

```typescript
import { Component } from '@angular/core';
import {XrmContextService } 'kipon-xrmservice';
import { AccountService, Account } from './account.service'; // assumed the service and this component is hosted in same folder

@Component({
    selector: 'my-component',
    templateUrl: './my-component.component.html'
})
export class MyComponent {
	account: Account;
	constructor(private xrmServce: XrmContextService, private accountService: AccountService) {}

	ngOnInit() {
		let me = this;
		xrmService.getCurrentId().subscribe(id => {
			this.accountService.get(id.id).subscribe( a => {
				me.account = a;
			});
		});
	}
}
```

The above component assumes that we can get an account id from the xrmContextService, and then fetch that account from our AccountService, and
finally assign the local account property of the component to the value returned from the get method of accountService.

Be aware that any of the methods defined in the Account services, returns Observables so nothing will happen until you subscribe. The above
code example shows how that is done.


### query
The query method of the XrmContextService has the same basic signature as the query method of the XrmService. This means that what we are getting back is an 
XrmQueryResult that allow us to do next() and prev() calls on the result to browse through the result. The only difference between the XrmService and the XrmContextService
is the signature of the method, and the fact that the XrmContextService is resolving strongly typed properties, methods etc. , also on the next() and prev() methods.

On top of that, the XrmContextService is using a Condition() object to define the where clause of a query. This part of the implementation is still very draft, and several
operators and value maps are still missing. They will be added on a need base. Please post and issue on the git repository if you are in need of ceertain maps, and i will
try to find time to implement them asap.


## License

MIT © [Kipon ApS, 2018](mailto:kip@kipon.dk)