# xrmservice

## What is kipon-xrmservice
The XrmService is a very basic service you can use to build angular pages with Dynamics 365 as backend.

It is based on the HttpClient implementation of angular 4/5.

The purpose is to make it a bit easier to use the WebAPI of Dynamics 365, without overcomplicating things to much.

The XrmService supports get (for single record fetch), query(...) to fetch a list of records, create/update/delete to perform
such operation and put, to update a single attribute on an entity.

You can use XrmService directly in your components, but to keep a good solid separation of service
concerns and components concerns, I recommend that you only inject the XrmService into other services.
These services can then use the XrmService to perform the actual http(s) calls to the Dynamics 365 platform.

If you are looking for a more powerfull programming model, it might make sense to take a look at the XrmContextService
documentation page, found here:

[Go to XrmContextService documentation page](https://github.com/kip-dk/angular-xrmservice/blob/master/Web/kipon-xrmservice/XRMCONTEXTSERVICE.MD)

## Installation

To install this library, run:

```bash
$ npm install kipon-xrmservice --save
```


and then include the XrmServiceModule and XrmService in your `AppModule`:

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

// Import your library
import { XrmServiceModule, XrmService } from 'kipon-xrmservice';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
	XrmServiceModule
  ],
  providers: [ XrmService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### XrmService API
The XrmService is Injectable, and uses angular HttpClient to map relevant calles to Dynamics 365.

All example in below show how to build a specific entity services, using the xrmService to simplify the actual communication with Dynamics 365. 
by using the XrmService, you save the hassel og setting up headers, and url structure, map to correct https methods etc.

All methods returns Observable<T>. Remember that an Obervable are lazy, and nothing will happen until you subscribe, ex.

```typescript
xrmService.get<MyEntity>('my_entitys','a guid identifyer').subscribe( r => {
   // now r is something that looks a lot like a MyEntity, assuming you defined it to have properties according the my_entity schema
});
```

Also remember that what you get back from each method is the json object returned from the Dynamics 365 API. In above example, you could think that the object return
has been created by calling a constructur of "MyEntity". That is NOT the case. The returned object is simply the json object, returned from the Dynamics 365 API.


The following methods is supported.

#### xrmService.setVersion(v: string)
Use setVersion(v:string) to upgrade or downgrade the version to be used for calls to Dynamics 365. Default is version 8.2. Only parse the version number, ex. xrmService.setVersion('8.0') 
to use earlier version of the Web API.  Inject the XrmService into you root component and call the setVersion method from there if needed.

If you are using dynamics 365 version 8.2 or later, you do not need to call setVersion to get the correct version. It will be called automatically by the XrmService constructor, using the
setVersion method on Xrm.pge.context, introduced with Dynamics 365 version 8.2. Earlier version will assume version 8.0, but even if you use 8.1, you are all set with this version, because
the API version for version 8.x i accumulative, and it is your installation and not the version number that determin what is supported and what is not.
```typescript
xrmService.setVersion(v: string)
```

#### xrmService.getContext()
use getContext() to get an instance of the Xrm.Page.context.  The method will look for a global implementation, and if not found, look in current frame and parent frame to find an instance.

```typescript
xrmService.getContext()
```

#### xrmService.getCurrenKey(): Observable&lt;XrmEntityKey&gt;
The getCurrentKey() will try to find the primary key of current form by looking in the form url parameters ( id, typename ). If not found, it will try look in the window.parent form, and use the 
Xrm.Page.ui.data.entity to get knowledge on what the parent object is.

```typescript
xrmService.getCurrentKey().subscribe(r => {
	// r is an instance of XrmEntityKey ( { id: '', type: ''} )
	// r.id will be null, if no key found
});
```

#### xrmService.get&lt;T&gt;(entityTypes: string, id: string, fields: string = null)
The get method allow you to get a unique identified instance of a entity, ex. found via the getCurrentKey() method.

entityTypes is the plural name og the entity to be used, ex 'accounts'  or 'contacts'.. etc. The id is the Guid (string) value of the entity
fields is optional, but should be parsed as best pratcise. All properties of the record will be returned otherwise, giving a performance penelty on your application.

```typescript
import { Injectable } from '@angular/core';
import { XrmService } from 'kipon-xrmservice';

export class Account {
    accountid: string;
	name: string;
	address1_line1: string;
}

@Injectable()
export class AccountService {
  constructor(private xrmService: XrmService) { }

  get(id: string): Observable<Account> {
	return this.xrmService.get<Account>('accounts', id, 'accountid,name,address1_line1');
  }
}
```

#### xrmService.query&lt;T&gt;(entityTypes: string, fields: string, filter: string, order: string = null, top: number = 0)
The query methods allow you to get a list of records for a entity type, matching the parsed filter, sort and page size.
The subscribe(r => r,  where r is an XrmQueryResult) will parse on an XrmQueryResult. The class has a property for the context, an array called value, containing the
matching instances, fetched from the Dynamics 365 service, and finally a prev() and a next() method that can be used as shortcut to fetch prev or next page.
If you are on page one, prev will be null. If you are on last page, next will be null.

```typescript
import { Injectable } from '@angular/core';
import { XrmService } from 'kipon-xrmservice';

export class Account {
    accountid: string;
	name: string;
	address1_line1: string;
}

@Injectable()
export class AccountService {
  constructor(private xrmService: XrmService) { }

  query<Account>(filter: string, orderby: string, top: number = 0): Observable<XrmQueryResult<Account>> {
	return this.xrmService.query<Observable<XrmQueryResult<Account>>('accounts', 'accountid,name,address1_line1', filter, orderby, top );
  }
}
```

#### create&lt;T&gt;(entityType: string, t: T): Observable&lt;T&gt; 
Create a new instance of T, and return the created instance. 

```typescript
import { Injectable } from '@angular/core';
import { XrmService } from 'kipon-xrmservice';

export class Account {
    accountid: string;
	name: string;
	address1_line1: string;
}

@Injectable()
export class AccountService {
  constructor(private xrmService: XrmService) { }

  create(name: string: address1_line1: string): Observable<Account> {
	let acc = new Account();
	acc.name = name;
	acc.address1_line1 = address1_line1;
	return this.xrmService.create<Account>('accounts', acc );
  }
}
```

#### update&lt;T&gt;(entityType: string, t: T, fields: string): Observable&lt;T&gt; 
Update an instance of T, and return the updated instance. 

If you parse null or blank string in fields, null will be returned from the subscribe method. If you add fields as a comma separated
string of fields to be returned, you will get an object with these properties for the record updated.

```typescript
import { Injectable } from '@angular/core';
import { XrmService } from 'kipon-xrmservice';

export class Account {
    accountid: string;
	name: string;
	address1_line1: string;
}

@Injectable()
export class AccountService {
  constructor(private xrmService: XrmService) { }

  update(accountid: string, name: string,fields: string): Observable<Account> {
	let acc = new Account();
	acc.name = name;
	return this.xrmService.update<Account>('accounts', acc, accountid, fields );
  }
}
```

#### put&lt;T&gt;(entityType: string, id: string, field: string, value: any): Observable&lt;T&gt; 
Update a single field on the entity with a new value

```typescript
import { Injectable } from '@angular/core';
import { XrmService } from 'kipon-xrmservice';

@Injectable()
export class AccountService {
  constructor(private xrmService: XrmService) { }

  put(accountid: string, field: string, value: any): Observable<Account> {
	return this.xrmService.put<Account>('accounts', accountid, field, value );
  }
}
```

#### delete(entityType: string, t: T): Observable&lt;null&gt; 
Delete a record. 

```typescript
import { Injectable } from '@angular/core';
import { XrmService } from 'kipon-xrmservice';

@Injectable()
export class AccountService {
  constructor(private xrmService: XrmService) { }

  delete(accountid: string): Observable<null> {
	return this.xrmService.delete('accounts', accountid );
  }
}
```
### XrmContextService
The xrm context service is  work in progress. The services i still experimental and subject to api changes, however the basic idea is
taken form.

While XrmService is a simple map of strings to correct url and methods against the Dynamics 365 service, the XrmContextService is more a
programming model where queries is defined by TS prototype objects, objects are cached within the context, field level 
change management is supported, allowing  you to call a simple update(objectinstance) method to push your changes to the api and more.

For a more complete documentation of the XrmContextContext service:

[Go to the XrmContextService documentation page](https://github.com/kip-dk/angular-xrmservice/blob/master/Web/kipon-xrmservice/XRMCONTEXTSERVICE.MD)


## License

MIT © [Kipon ApS, 2018](mailto:kip@kipon.dk)
