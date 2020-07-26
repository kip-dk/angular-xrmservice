## What is kipon-xrmservice
kipon-xrmservice is an angular 7 library that makes it easier to work with Microsoft Dynamics 365 web api. 

Changelog has been moved to the buttom of this page.

## Installation
To install this library, run:

```bash
$ npm install kipon-xrmservice --save
```

and then include the KiponXrmServiceModule and XrmService in your `AppModule`:

(KiponXrmSecurityModule is optional. Only include it if you need it.)

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule, APP_INITIALIZER } from '@angular/core';

import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { KiponXrmserviceModule, XrmInterceptor, KiponXrmSecurityModule } from 'kipon-xrmservice';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    KiponXrmserviceModule,
    KiponXrmSecurityModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: XrmInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## Local development outside Dynamics 365
While your project is under development, it is timeconsuming if you need to deploy any change to Dynamics 365 Web Resource library on any change. A better aproach is simply to use the ng serve.

If you are developing on-premise, this is easy. You simply have to setup a proxy configuration, enable basic authentication on your development instance of Dyanmics 365 (never do so on a production instance),
and finally start ng serve with the proxy flag.

First thing first, the proxy config file should be put in the root folder of your angular project. Name it proxy.config.json to be consistent.

```json
{
  "/api/*": {
    "target": "http://mydevbox/mycrmorg",
    "secure": false,
     "changeOrigin": true,
    "logLevel": "debug",
    "auth": "myusername:mypassword" 
  }
} 

```
and then start the ng serve with the proxy flag
```bsh
ng server --proxy-config proxy.config.json
```

If you have to develop against an online environment, this is not an option. Instead you have to setup the url to be used in the application:

Below an example on how your angular module definition would look:

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { KiponXrmserviceModule, XrmInterceptor, XrmConfigService } from 'kipon-xrmservice';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

const xrmInitializerFn = (appConfig: XrmConfigService) => {
  return () => {
    if (environment.production) {
      return {};
    } else {
      return appConfig.loadAppConfig('assets/xrmConfig.json');
    }
  };
};

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    KiponXrmserviceModule
  ],
  providers: [
    XrmConfigService,
    { provide: APP_INITIALIZER, useFactory: xrmInitializerFn, multi: true, deps: [XrmConfigService] },
    { provide: HTTP_INTERCEPTORS, useClass: XrmInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```
The trick is in the APP_INITIALIZER. It will load a configuration file that hosts the url for your Dynamics 365 instance. You can adjust
the method to your need, but for this demo, it just loads the file from the assets folder, but only if it is not a production build. (Assuming
that you will build a production version before deploying to Dynamics 365 - when running inside Dynamics 365 as a WebResource, the url will be taken from the CRM context, and
authentication will be shared with the Dynamics 365 client).

Here is how the "assets/crmConfig.json" file should look:

```json
{
  "tenant": "",
  "clientId": "",
  "postLogoutRedirectUri": "",
  "endpoints": { "orgUri": "https://yourorganization.crm.dynamics.com" },
  "cacheLocation": ""
}

```
Due to CORS restrictions this will not work without hassel. But you can work around that by using Chrome as your development browser, and then start Chrome with some additional flags:

```bsh
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --disable-web-security --user-data-dir="C:/ChromeDevSession"
```

After you have started chrome, login to your organization. Then open an additional tab and navigate to http://localhost:4200. This session will now share the credentials with the
first tab, and you have disabled CORS so that will not give you headeck.

The crmConfig json configuration object has been prepared to enable the usage of adal.js to support angular applications running outside Dynamics 365, but that part is still work in progress.

## Service Generator
To separate concerns in your application, I recommend that you build angular services to provide all the needed integrations to Dynamics 365. To make the job easy, i have build a simple
Dynamics 365 solution that can generate the initial service for you:

You can download the Dynamics 365 solution file from here:

[Dynamics 365 8.0 XrmService genereator](https://github.com/kip-dk/angular-xrmservice/blob/master/Web/kipon-xrmservice/XrmContextServiceGenerator_target_CRM_8.0_managed.zip) <br />
[Dynamics 365 8.2 XrmService genereator](https://github.com/kip-dk/angular-xrmservice/blob/master/Web/kipon-xrmservice/XrmContextServiceGenerator_managed.zip) <br />

Simply download the version you need, and then navigate to the configuration page of the solution to start generate a service. 

## API
The kipon-xrmservice package contains two services. XrmService and XrmContextService. The first is a very simple string based wrapper where you parse strings to the methods and get 
Dynamics 365 objects in result. the service does not offer a lot more than simple map of string, and setup of needed headers. 

The XrmContextService on the other hand is more a programming model, for building object oriented application with Dynamics 365 Web API as backend. For this service, you define a prototype, and
based on such prototype, the service will build the needed create,upate,delete,get,put and query requests matching your object. On top of that, this service provides a context for whatever
object you are working with, so objects with same type and id only exists once even if it is fetch multiple times. Let say you fetch and account, including the primary contact, and after that
you fetch all child contacts of the same account, then if the primary contact is part of the result in both cases, the latest result will actually return the instance from the first result, updated
with information comming from the second result. The consequence is that there is only one instance of that contact. This is very powerfull if you need to update the object, 
because you do not need to do anything to keep the client objects in sync. There is only one. 

Finally this service offers change-management of your object, so it knows what to push to the serve on update, and you can simply say service.update(myinstace), and
it will find all fields that was changed by the UI and push them to the server as a Dynamics 365 update request.

My recommendations is basically to forget all about XrmService. It is there to serve as a base implementation for XrmContextService, and as such not intended to be used directly.

### XrmContextService

#### Creating a service:
Below an example service for account, created with above mentioned tool. The tool is still targeting angular 4/5, so i have remove "/Observable" from the Observable import manually,
and that simple change migrated this service to be an angular 6 thing.:

```typescript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { XrmQueryResult, XrmContextService, Entity, Entities, EntityReference, OptionSetValue, Condition, Operator, Comparator, XrmAccess } from 'kipon-xrmservice';

export class Account extends Entity {
	constructor() {
		super('accounts','accountid', true);
	}
	accountnumber: string = null;
	businesstypecode: OptionSetValue = new OptionSetValue();
	creditlimit: number = null;
	name: string = null;
	primarycontactid: EntityReference = new EntityReference().meta("contacts","primarycontactid");
	access:XrmAccess = new XrmAccess(true);	
	meta():Account {
		this.creditlimit = 0.0000000001;
		 return this;
	}
}

@Injectable()
export class AccountService {
	localPrototype: Account = new Account().meta();
	constructor(private xrmService: XrmContextService) { }

	get(id:string): Observable<Account> {
		return this.xrmService.get<Account>(this.localPrototype, id);
	}

	query(search:string): Observable<XrmQueryResult<Account>> {
		let condition: Condition = new Condition().where('<search field>', Comparator.Contains, search);
		return this.xrmService.query<Account>(this.localPrototype, condition);
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

First we define an object "Account", and there we are defining the columns we need. As you can see, the context is using strongly typed object for optionset, entity references. 
The XrmContextService will automatically map between the Web API format and this format, making it easy for you to work directly on the object field name with a natural structure.

Also remark that we do not include the key (accountid) as a property. Instead we parse the name of the field to the constructor, and the class inherits from Entity. This is because the
XrmContextService is streamlining name of key to be "id". Even though the original key name is always fetched, it is removed from the object and replaced with a field called "id". The reason
for this design is that it is so much easier to create generic CRUD operation when you know the name of the key field.

The access column is a special column you can choose to add to your object. It will contain witch priviliges the current user has on a specific instance. The "true" flag on the constructor
indicates that this information should be loaded lazy (meaning that it will not be there until you ask for it). If your parse false, the information will be auto populated immidiately after
and instance has been fetch from the server.

The "strange" construction around creditlimit is to force any update of the field to be a decimal, otherwise Dynamics 365 web api might throw a "expected decimal got int" exception on create/update.

Then lets look at the AccountService. First line of the prototype is creating an instance of the account object, and is calling the meta() method on the instance to populate values that should only
apply to metadata instance, and not to any other instance you end up creating in your application. This instance is parsed to all XrmContextService methods, and basically that is defining to the
service what to fetch, what is the key, what is the property types etc.

The additional method should be pretty self explaining. But remember that all the methods returns Observable. This means that you have to subscribe to the methods in your components, ex on the form:

```typescript
this.accountServiceInstance.get('a guid for the a account').subscribe(r => {
  // r is now an instance of account matching the parsed guid
});
```

#### XrmContextService.get(prototype: Entity, id: string): Observable<Entity>
Get the account instance matching the id. As you can see, the generated query service hides the detail of parsing the metadata instance to any component using the AccountService.
This is the basic pattern used for all generated methods.

#### XrmContextService.query(prototype: Entity, condition: Condition, orderby?: string, pageSize?: number, count?: bool) : Observable<XrmQueryResult<T extends Entity>>
Query according to the filter. Remark, you are building a condition, based on the Condition object. This makes it easier to setup the relevant filters.

In addition, you can parse how to sort - name of field to sort on, pagesize, and wether to return total number of records.


####
#### fetch<T extends Entity>(fetxml: Fetchxml): Observable<XrmQueryResult<T>>
Query according to the fetchxml. Fetchxml is a simple builder class that allow you to define
your query with conditions, link, inner and outer joins:

```typescript

let query = new Fetchxml(myprototype, condition);
let link1 = query.entity().link(mylinkentityprototype, navigationproperty, condition);
let deeperlink = link1.link(....)

xrmcontextservice.fetch(query).toPromise().then( r => {
  // do something with your objects
});

```
Fetch xml requests build with the Fetchxml builder class supports paging as with query method.


#### fetchxml<T extends Entity>(prototype: T, fetchxml: string): Observable<XrmQueryResult<T>>
Query according to the fetchxml. You can build your fetchxml manually or use new Fetchxml(entity, condition) to build the fetchxml:

```typescript

let query = new Fetchxml(myprototype, condition);
let link1 = query.entity().link(mylinkentityprototype, navigationproperty, condition);
let deeperlink = link1.link(....)

xrmcontextservice.fetchxml(myprototype, query.toFetchXml()).toPromise().then( r => {
  // do something with your objects
});

```

Be aware, especially the Fetchxml class an signature is likely to change over time. For now it only support very simple lookup join scenario. 

#### XrmContextService.create(prototype: Entity, instance: Entity): Observable<Entity>
Create a new instance from the data in the instance based on the definition in the prototype, and return the result on subscribe. 
Be aware that returning the result from the server is supported from version 8.2 only, so if you are using version 8.0 or 8.1, you will get your
own instance back with no other changes that the id has been assigned.

#### XrmContextService.update(prototype: Entity, instance: Entity): Observable<Entity>
This will push back any field changed in instance by the UI, after the instance was fetch through this concept. Remember, you can ONLY update entites that was originally
created or fetched from get or query, because these process will add the change management information to the object. Only fields that was actually changed by the UI
will be pushed back to the server in the update request.

If you are using version 8.2 or above, the object returned will be populated with information from Dynamics 365, based on the object response, so any server side calculated field,
included in you fetch will be up-to-date after update. That is NOT the case if you use version 8.0 or 8.1, because these version do not support returning the object on update.

#### XrmContextService.delete(instance: Entity): Observable<null>
This will delete the instance parsed to the method. If the instance was created by the XrmContextService from get/query or create, you can simply parse the instance. If you created the instance through code,
you need to ensure that _pluralName and id as appropriate values according to your need.

#### Additional methods, not supported by the generator

##### XrmContextService.put(prototype: Entity, instance: Entity, field: string, value? : string) : Observable<null>
This method will do a single property update on the entity. If value is parsed, that value will be assigned to the field on the entity. If value is NOT parsed, the method assume that
you simply wish to push the current value on the instance back to Dynamics 365. 

Be aware that null is supported and will be mapped to a property delete. In the Web API, clearing a property require you to do a DELETE method, while setting a property require you to
do a PUT method. In the XrmContextService, you always use the put method, and that will map to a http put, if the attribute has a value, and a http delete if the property is set to null.

##### XrmContextService.commit(transaction: XrmTransaction): Observable<null>
This will commit a transaction. Please look below in dedicated paragraph how to use transaction.

##### XrmContextService.action(name: string, data:any, instance?: Entity): Observable<any>
This method allow you to do unbounded and bounded actions. If you need to do an unbounded action, just pase the name, and the appropriate data structure according the the Web API. If you need to
do a bounded action, also parse the instance you wish to bound the action to.

#### XrmContextService.func(name: string, data: any, instance?: Entity): Observable<any> (added in version 2.2.3)
This method allow you to do unbounded and bounded function calls. name is the name of the function, remember, many function require that you add Microsoft.Dynamics.CRM to the name, ex. Microsoft.Dynamics.CRM.ExpandCalendar.
Data is a simple json object, mathing the input requirement of the api. instance is an instance of an entity, parse the instance if it is a bounded function. 

Be aware that figuring out the name and the correct formating of the parameters (data) can be a process adding a lot of headeck, due to the lake of in dept documentation in the Dynamics 365 api. If you need
to control how a parameter value is transform to a string value in the url, use the FunctionPropertyValue to hook in your method.

```typescript
 var data = {
      Start: new FunctionPropertyValue('startResultValue'),
      End: new FunctionPropertyValue('endResultValue')
    };  
```

above example will generate a parameter list like this (Start=@p1,End=@p2)?@p1=startResultValue&@p2=endResultValue

(the above example IS NOT a valid parameter url. Dynamics 365 cannot resolve startResultValue and endResultValue)

For most needed datatypes, you do not need to consider above. They are already mapped correctly. This goes for

string
number
boolean
EntityReference
OptionSetValue


##### XrmContextService.applyAccess(prototype: Entity, instance: Entity): Observable<Entity>
If your object defines the XrmAccess property, and defines it to be loaded lazy (default setting if you are generating the property with the XrmContextService generator), this method will populate
the access setting for the instance.

## Migrating from version 1.x.x to 2.0.x (angular 4/5 => angular 6)
This steps only defines what you need to do in regards to upgrade the kipon-xrmservice. First you must upgrade your angular application to version 6, following the path documented by the angular team.

When that is done, what you need to do is the following.

1) Update kipon-xrmservice to version 2.x.x
2) Change your angular module definition to match above pattern. (the way you import the kipon-xrmservice module is sligthly different)
3) In each of your service that has been build on the XrmService or the XrmContext service do the following:

Change the Observable import from 
```typescript
import { Observable } from 'rxjs/Observable';
```
to

```typescript
import { Observable } from 'rxjs';
```

If you are using map, change according to the the pattern for maps:

you must import the map method explicitly from the rxjs operators

to:
```typescript
import { map } from 'rxjs/operators'
```

and then any service using this pattern:
```typescript
myservice.mymethod(...).map( r => {  ...; return r }).subscribe(t => { do something with t });
```

should be changed to follow this pattern
```typescript
myservice.mymethod(...).pipe(map( r => {...; return r})).subscribe(t => { do something with t })
```

### Be object oriented, and use your Entity classes for UI functionality beyond simple Dynamics 365 properties
In above example, we simply use the Account class to host properties that all maps to a property in the underlying dynamics 365 instance. But you can use the object beyond this.
Any property that is defined without a default value (null is also a default value) is considered irelevant for the Dynamics 365 web api, but is maintained across request due to the
id/type based caching nature of XrmContextService. This allow you to define properties inside the object to be used by your code.

```typescript
export class Account extends Entity {
	constructor() {
		super('accounts','accountid', true);
	}
	accountnumber: string = null;
	name: string = null;

  selected: boolean;

	meta():Account {
		 return this;
	}
}

```

Take a look at above example. The "selected" property has not been assigned any default, and therefore the framework knows that this attribute is irelevant for the Dynamics 365 API. It is to be used by the
UI only. If assigned a value, this value will be keept intact, even if an instance is re-fetched from Dynamics 365, because all objects are cached inside the XrmContextService, and on any additional fetch
of an object, already known to the context, it is simply updated with newest value, but only for thouse attributes know from CRM. All virtual attributes is keept as is.

You can use the prototyp same way to define methods. Any method defined on a prototype will be available on and object fetch through the XrmContextService with get or query. If you create new instance
they will be there due to the  new Account() build in functionality of typescript, while on records returned from Dynamics 365 Web api as json, these methods will be populated by the framework.

Lets look at an example:
```typescript
export class Account extends Entity {
	constructor() {
		super('accounts','accountid', true);
	}
	accountnumber: string = null;
	name: string = null;

  selected: boolean;

  getColor(): string {
    if (this.accountnumber == null) return 'red';
    return 'green';
  }

	meta():Account {
		 return this;
	}
}
```
In above example, I have added a method getColor() that will return red if no accountnumber has been set on the account, otherwise green. 

#### onFetch(): void
Records returned from Dynamics 365 will NOT be created using the constructor of the Entity. As a result, you should not add any functionality to the constructor beside what
only need to be done when creating new instance from code.

Instead you can add a method "onFetch()" to the record. This method will be called on get, query, after update and after create. This allow you to define how your objects should be initialized.


```typescript
export class Account extends Entity {
	constructor() {
		super('accounts','accountid', true);
	}
	accountnumber: string = null;
	name: string = null;

  selected: boolean;

  onFetch(): void {
    if (this.selected == null) this.selected = false;
  }

	meta():Account {
		 return this;
	}
}
```
In above example, we are simply assigning the virtual property "selected" a value if it has not been assigned before.


### fetch related records ($expand)
Dynamics 365 web api support fetching related record as part of a get. Back in the old OData days, this worked both on query and get, but in Web API it only works on get. The XrmContextService supports this
by naming convention in your objects:

```typescript
export class Competitor extends Entity {
  constructor() {
    super('competitors', 'competitorid', true);
  }
  name: string = null;

  meta(): Competitor {
    return this;
  }
}


export class Opportunity extends Entity {
  constructor() {
    super('opportunities', 'opportunityid', true);
  }
  name: string = null;
  customerid: EntityReference = new EntityReference().meta("contacts", "customerid_contact");

  opportunitycompetitors_association: Competitor[];

  meta(): Opportunity {
    this.opportunitycompetitors_association = [ new Competitor().meta() ];
    return this;
  }

  hasCompetitor(com: Competitor) {
    return this.opportunitycompetitors_association != null && this.opportunitycompetitors_association.find(r => r.id == com.id) != null;
  }
}

```

In above example, I am defining that i wish to get the list om associated competitors when performing af get on an opportunity. "opportunitycompetitors_association" is name name of the relationship according
the the Dynamics 365 metadata. That convention need to be followed. Secondly you need to make sure that the meta instance of Opportunity has a value defined with on record, so we have a place to capture
the metadata needed for the competitor entity.

You can add several related entities that will all be fetch on GET, but remember to take performance into considuration.

### Transaction
The XrmContextService allows you to create transaction that will all be executed in one WEB API request, and by design, Dynamics 365 will execute all or nothing - nothing if somethings goes wrong.
For most type of applications it is critical to be able to perform multi operation within same scope, and be sure that it is all or nothing.

That is what transactions are for. Building transactions is easy.

```typescript
let trans = new XrmTransaction();
trans.update(prototype, instance);
trans.create(prototype, instance);
...
xrmService.commit(trans).subscribe(r => {
   // now all  the create/update/delete etc. operations has been pushed to the server and response was ok.
});

```

## changelog

### version 2.5.6 2020-06-15
count() on xrm service now add distinct='true' if the query is distinct

### Version 2.5.4
count on xrmcontextservice is changed to handle "AggregateQueryRecordLimit exceeded. Cannot perform this operation." exception, and return 50000 in that case. The result
is, that a count of 50000 is ether 50000 or more. 

The error pipeline in XrmInterceptor was changed to pop the error futher up the drain, so even when you use the inspector, you can still catch the error and handle on your own
(this was a pre-requirement to get count to work.)

### Version 2.5.0
xrmcontextservice is no longer returning the original object served by dynamics 365, not even for the first time fetch. It is creating a new instance by { } and clones
properties into the result.  To get the original object, you must call xrmContextService.includeOriginal(true) before you first call the the service. Then the original
object will be added to each instance by the "secret" property "_original$".


### Version 2.4.8
Property name is now used as alias on link in fetch xml. This is to ensure you can predict the names on the returned properties for a linked entity.


### Version 2.4.6
xrmcontextservice.fetch when using linked entities with attributes, the linked attributes is now synchronized when refetching same record again. Currently there
is no formal way to extract these properties, so the have the standard pattern of json based fetchxml result on the form entity['{alias}.{property}'] ex. 
contact['ac.name'] : 'Company name', if ac is used as alias when linking parent account to a contact fetch

### Version 2.4.5
xrmcontextservice do not try populate related entity properties. It is not supported


### Version 2.4.4
xrmcontextservice must omit sort. It is not supported

### Version 2.4.3
xrmcontextservice now has a count(fetchxml) method returning number of mathing records for the fetchxml


### Version 2.4.2
Condition.OwningUserIsCurrentUserOrHirachy() and Condition.CurrentUserIsMemberOfOwningTeam() allow you to filter on the ownertype on entities having ownership (not orginizational entities)

### version 2.4.0
Deprecated misspelled method getCurrenKey has been removed. you need to use getCurrentKey()

getCurrentKey(repeatForCreateForm: boolean = false)  repeatForCreateForm will monitor change of the parent form type, and when it is changed to formtype 2 (update) from 1(create), it will refresh the key.
This allow a simple impl. where the state of an embeded resource is different for the entity in create and update form (typically if the embeded form need to attach or create sub entities to the parent, that cannot be done
until the parent has been saved).

###  version  2.3.11 2020-05-19
2.3.9  - 2.3.11
Minor fixing in handling paging cookie for fetchxml, ex. & need to be encoded, and used reg expr. not working in IE 11, all fixed in version 2.3.11


### version 2.3.8 - 2020-05-16
xrm contextservice now supported paging fetch. Instead of calling fetchxml(...), you must call fetch(xml: Fetchxml):Obs..<..>.
By parsing the Fetchxml builder, you allow the framework to manipulate the fetchxml to include correct paging, and therefore you can
use the next()  and nextlink in the returned result. 

The fetchxml(..) method will stay on xrmcontextservice to support execution of fetchxml build with other methods than the Fetchxml builder, however if
you need paging here, you are on your own. The framework will not even try to set the next() method and nextlink property on the result.

### version 2.3.7 - 2020-05-14
outerjoin support on Fetchxml object and alias condition, only supported for fetchxml

### version 2.3.5 - 2020-05-14
innerjoin support on Fetchxml object

### Version 2.3.4 - 2020-05-14
keyname was not auto included in list of attributes

### Version 2.3.3 - 2020-05-14
Fetchxml support for sort(attrname, descending = false) to allow server side sort of the result. Multi sort can be added by calling sort multi time

### Version 2.3.2 - 2020-05-14
Fetchxml support for count, page and distinct

### 2.3.1 - 2020-05-14
Implemented EXPERIMENTAL support for fetchxml on xrmcontextservice. To support more advanced query, a fetchxml(entity: Entity, xml: string ) has been introduced. On top, a Fethxml class
has been added to enable building the fetchxml using Condition etc. The api is experimental, and for now only smaller queries are supported (no fallback to to $batch for large has been implemented yet).
Entities received from fetchxml has same nature as received by normal api, and all patterns applied by the query(..) method is also applied on result from fetchxml, including object caching on id.


### 2.3.0 - 2020-03-16
Removed support for version 8.2 of CRM. The support for version 8.2 installation is complicating the version management between the url posted
and the @odata.link fields, and is giving errors on earlier version of the framework on Dynamics 365 online 9.1 installation. Therefore we have decided to to stop
the support for CRM 8.2 from the start of version 2.3.0. If you need support for Dynamics 365 version 8.2, do NOT update beyond version 2.2.19.


### 2.2.19 - 2020-02-21
IE and Edge is sometime giving cross script error "Can't execute code from a freed script". This issue is caused by the fact that the framework is keeping a long living reference to the
initiating page Xrm instance to have access to clienturl, formtype and more. To solve this issue, the way xrmservice is communicating with its parent frame or opener is changed, so information
is stored locally it its own "window"["variable"], and the occurance of cross frame/popup scripting is reduced to a minimum, and only occure once per function, and the parent/opener function is
only used to initialize the corresponding values in the child/popup window.


### 2.2.18
Constructor on EntityReference has been extended to support creating full valid references through the constructor, so you do not need to manually assign pluralName and assocationnavigation property after
creating the entityreference instance.

ToEntityReference(associationnavigationproperty: string) has been added to Entity. The purpuse is to make it easy to assign an assosiationproperty a value from an instance of an entity.

Be aware, if you assign a reference field on an entity with this method, you MUST parse
the associationnavigationproperty related to that specific field, otherwise a create/update operation will fail. An entity reference must map to an OData navigation property on the form

{associationnavigationproperty}@odata.bind = /{entity.pluralName}(entity.id), and the associationnavigationproperty is not the same name as the property name, so for the framework to create this map,
the name of the associationnavigationproperty is needed.


### 2.2.17 Comparator.DoesNotContainsData
Comparator.DoesNotContainsData gave null ref exception for date fields.

Below might give slightly different behavior on some conditions, due to "smart-convert" null values to natural conditions. The  former code would
proberbly throw and an exception, so it is unlikely it will change anything.

Auto convert Equals compareator with null value to DoesNotContainsData
Auto convert NotEquals comparator with null value to ContainsData



### 2.2.15 Resolve url
If the url (lowercased) contains the word webresources, it is assumed that the page is running from inside CRM, and instead of falling back to the angular developer url  http://localhost:4200, it will
take the base url, from current url. That enables browsing CRM webresources directly, without having a context from the parent or opener.

### 2.2.14
onFetch (and other entity property methods) was not populated (and triggered) when using angular 8. The root cause is due to angular 8 running ES6 if the browser supports it
and the return from for (var prop in obj) has different behavior in ES5 and ES6. This issue has been fixed in version 2.2.14


### 2.2.12
Condition for XrmContextService now support "raw filtering". This means that you can add any filter to the condition using a simple string. The advantage is that this will
allow you to add filters that are not directly supported by the XrmContextService, but is supported by the Webapi.

The disadvantage of this method is obviously that you have to concatenate the string values into a valid condition your self. You can combine raw with supported conditions.

### 2.2.11
Deep iframing took a couple of tries to get to work within dynamics 365. It is now tested and works as expected.

First of all, the context will be found in the parent or opener, and expose there, for any sub-iframe loading. This allow deployment angular aplication within each other using iframes.
I do not encourage the use of this pattern. Having multi components in a single angular application is a better pattern, but in some rare situations it might be relevant to take this approach,
and now it works.

As for getCurrentKey() that will also look up the link of iframes to find the key, but you must call the method in each iframe, because that will populate the needed methods to be available for child iframes.

If you need a child to work on another key than the parent, you must parse id and typename as url parameters.

Beside this, some minors and getting access level, did not work, when running as a webresource from CRM has been solved.

### 2.2.9
Support for deep iframing. If you have an angular app. populated as a webresources, and within such app creates another iframe, also running an app using the xrmservice, the later
would get a wrong context, and direct any call to localhost:4200 because it was unable to resolve the context correctly. This has been solved by letting each page expose
window["GetGlobalContext"] to be the context it is using it self. 

Same level of sharing goes for getCurrentKey() because window["Xrm"] is also shared same way. If your inner iframe need to target another object than the outer, you MUST populate
id and typename to be used in the inner frame on the url for the inner frame, oterwise the inner frame will use the same entity id as the outer.

The misspelling of the getCurrentKey method on xrmService has been fixed, and the wrong spelling (getCurrenKey) as been deprecated.

### 2.2.5 - 2.2.8 Force https and test token
These three versions does not add any new. The api on xrmservice is exposing "token". If you set this, before any other call to xrmService or xrmContext service,
this token will be put into any call in the Bearer authentication header. You can use ADAL.js or MSAL.js (there is an angular version for the later) to
get a token and parse it into your xrmContext. This allow you to do real SPA application that runs outside Dynamics 365. 

The token has been there all the time, but now it is populated correctly for all calls.

Secondly you now have a foceHttps method on the xrmService. This is convinient if you have an onprem. dev environment running http, but for some reason, you need it to
run https even though the installation has been installed with http. This has been proven to work, where i needed to test integration between Graph api and Dynamics 365.
Call it before any other method on the service, and http:// will be changed to https:// before any call to CRM.

### 2.2.4
all http operations is now adding headers to the crm dynamics 365 web api. This enable a very simple implementation of SPA running outside Dynamics 365. 

The first draft of this, you can install MSAL.js alongside kipon-xrmservice, and then simply set token of the xrmservice according to the return from get token.

Be aware that the api for this functionallity migh change in upcomming version, where a more smoot SPA outside dynamics 365 implementation will be provided.

### 2.2.3
added support for functions. Dynamics 365 Web API has a number of functions that can be executed bounded or unbounded, with or without parameters.
Please refere to the Dynamics 365 documentation for details. the xrmservice now supported a simple func(...) method to call a dynamics 365 function,
while xrmcontext service has the same method, but taking more natural parameters, and streamline you entities an parameters into a well formatted
url that follows the speficiation. Be aware that many functions are not supported until version 9.0, and the Microsoft documentation is very limited 
and gives very few guidance on how to format parameters etc. This fact might leed to a situation where you end up having difficulties getting a function call to work.


### 2.2.2
calling getCurrentUserId() in developermode, where ctx. was created from XrmConfigService used localhos as url regardless of setting given by xrmconfigservice.
This has been fixed with version 2.2.2

### 2.2.1
Documentation only

### 2.2.0

Condition filter in XrmContextService now support Date

MetadataService has been renamed to XrmMetadataService and moved to its own KiponXrmMetadataModule. The service is only needed
in very special application that need metadata, and as such not needed as a 1. class memeber of the library. 

### 2.1.16
xrmservice was unable to resolve connection url when running in a web resource popup window. This has been solved by trying to
find the context through window.opener

### 2.1.15
On CRM 8.2 or less, id was not set on new entities after create.

### 2.1.14
values parsed to condition in xrmcontext service are url encoded.

### 2.1.7
Ref. fix on update entity ref.

### 2.1.6 
log update before update to console if debug is enable.

### 2.1.5
When using xrmcontextservice create, the instance return in the observable will now be the same instance as parsed into the create, but now
the id has been populated with the value from the server side create operation.

### 2.1.4
Entities now have a property _logicalName that is populated from query and get from the prototype definition. The logical name
is assumed to be the keyname, where "id" is removed at the end. This might not always be the case. In such case, the correct name can be
parsed to the constructor of the entity prototype definition. The code does render correct _logical name for standard activity entities
such as email, appointment, letter and task.

This value can come in handy when you need to query related entities such as notes, where you need the objecttypecode.

A new module KiponXrmAnnotationModule has been added, including a very basic service for handling annotations. For now it only
handles simple annotations, but the vision is to provide a full reusable service for all annotation related task, such as
attach files and more. The _logicalName property on Entity has been added to support a nice and simple api on this service.


### 2.1.3
xrmService.getCurrentUserId() : Observable<string> method to get the current user observable.
If you are running your application inside Dynamics 365 as as Web Resource, this method will always reutrn
the current user id instantly (you still need to sbuscribe), because it is available synchronized from Dynamics api.

If you on the other hand is running you app as a SPA outside CRM, the current user will not be available until it has
been fetch by the api use whoami(). By using xrmService.getCurrentUserId().subscribe(r => r is not the userid), you can 
await this operation by subscribing.

KiponXrmSecurityModule and XrmSecurityService has been added as an optional module that allow you to work with user data,
including role membership and team membership.

The module is still kind-of experimental to see if it make sence to add real service functionality beyond simple http(s)
map infrastructure in this library.

The service has been added as a separate module that need to be imported separatly.

### 2.1.1
Strip ref fields from {} when parsed as condition.

### kipon-xrmservice 2.1.x
With version 2.1.x of kipon-xrmservice the library now target angular 7.

### kipon-xrmservice version 2
With version 2.0.x of kipon-xrmservice the library now target angular 6. 

If you need it to work with angular 4 or 5, please use version 1.3.1



## Like this?
If you like this library, please go to the git repository and give it a star. That will confirm for other potential developers that this could be a good track.

[Goto git repository](https://github.com/kip-dk/angular-xrmservice) <br />

If you have issues, ideas or so, do not hesitate to post an issue on GIT. I try to be responsive and appriciate any input from you.

## License
MIT © [Kipon ApS, 2018](mailto:kip@kipon.dk)
