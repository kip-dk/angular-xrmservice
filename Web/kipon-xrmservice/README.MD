# xrmservice

## Installation

To install this library, run:

```bash
$ npm install kipon-xrmservice --save
```

## Consuming the XrmService

This project is work-in-progress, and not at all ready for reuse!!!.
The vision is to create a reusable service to centralize integration with 
dynamics 365 WebAPI.

Install the project in your angular project

```bash
$ npm install kipon-xrmservice
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
The XrmService is injectable, and is a angular HttpClient based map of relevant calles to Dynamics 365.

The following methods is supported.

#### xrmService.setVersion(v: string)
Use setVersion(v:string) to upgrade or downgrade the version to be used for calls to Dyanmics 365. Default i 8.2. Only parse the version number, ex xrmService.setVersion('8.0') 
to use earlier version of the Web API.
```typescript
xrmService.setVersion(v: string)
```

#### xrmService.getContext()
use getContext() to get an instance of the Xrm.Page.context.  The method will look for a global implementation, and if not found, look in current frame and parent frame to find an instance.

```typescript
xrmService.getContext()
```

#### getCurrenKey(): Observable&lt;XrmEntityKey&gt;
The getCurrentKey() will try to find the primary key of current form by looking in the form url parameters ( id, typename ). If not found, it will try look in the window.parent form, and use the 
Xrm.Page.ui.data.entity to get knowledge on what the parent object is.

```typescript
xrmService.getCurrentKey().subscribe(r => {
	// r is an instance of XrmEntityKey ( { id: '', type: ''} )
	// r.id will be null, if no key found
});
```

#### xrm.get<T>(entityTypes: string, id: string, fields: string = null)
The get method allow you to get a unique identified instance of a entity, ex. found via the getCurrentKey() method.

entityTypes is the plural name og the entity to be used, ex 'accounts'  or 'contacts'.. etc
the id is the Guid (string) value of the entity
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
## License

MIT © [Kipon ApS, 2018](mailto:kip@kipon.dk)
