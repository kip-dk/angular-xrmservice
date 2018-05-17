### 1.1.9 
Documentation only. Added documentation for associate and disassociate

### 1.1.7 (and 1.1.8 is same, npm was unwilling to update the new package)
  The new auth infrastructure gave some issues when installed in other projects using npp install. From version 1.1.7 this issue should be fixed.
  When defining several interfaces in one source, angular compiler sometimes don't get it all right.

### 1.1.6
  Added associate and disassociate to xrmService to support maintanance of M:M relationship

  For now the raw api function execute M:M operations in XrmService only. It will be added to XrmContextService and XrmTransaction shortly.

  Be aware that the new authenticate() method of xrmService is still draft and untested. The vision is to be able to use this
  framework to create SPA application, running outside Dyanmics 365 WebResource context, but still use single signon with Dynamics 365.

  You can now parse null as condition to a query in XrmContextService

  All get methods will add "Cache-Control", "no-cache" to the httpheaders to prevent anything between the angular client and the Crm service to cache results.

### 1.1.5 
Documentation only

### 1.1.4 2018-03-17

Comparator.where, now declare that all overridden paramter signatures returns a Comparator, making it easier to use the builder wattern
condtion.where(...).where(...)

### 1.1.3 2018-03-17
Sorry for the strange versioning. npm had a crash on 2018.03.17, and i ended up increasing versions to get it to work, but the bug was on the hpm site.

added debug(bool) on xrmContextService to make it easy to enable and disable debugging without having to inject the basic xrmService

references to ssri in poc and generator project update. (this change has no impact on the kipon-xrmservice, it is just to remove warning on git)

### 1.0.167 - 2018-03-11
xrmContextService [context] is updated on batch operations, elements created is added and marked updateable, elements deleted are removed from context and changemanagement context
element updated or with single value put are simply updated in the changemanage object.

### 1.0.165 - 2018-03-07
For some reason getCurrentKey sometimes returns a guid without - in the correct positions. This results in wrong requests when used to build api calles.
this has been fixed by validating key before returned. "-"'s will be added to the id if missing.

### 1.0.161 - 2018-03-07
xrmContextService.clone is setting keyname and pluralname according to prototype

### 1.0.160 - 2018-03-07
support for update on XrmTransaction

### 1.0.159 - 2018-03-05
added Comparators Greater and Less

### 1.0.158 - 2018-03-05
fail on xrmContext.getCurrentKey if called in a none entity context

### 1.0.157 - 2018-03-04
xrmService.getParameter(string) returns a value from the parameter string if it is there. Convinient to extract other parameters from the url than the entity key.

### 1.0.156 - 2018-03-01
Consistent handling of id's and references. 
If Dynamics addes {} to an id, or return an id in uppercase (using EntityReference as reference data container), it will be manipulated to not have {}, and 
always be in lowercase.

XrmEntityKey return from xrmService.getCurrentKey() will always return without {} and in lowercase.  This fix makes it easier to do client side join of data based on keys
if data is fetch from several calls and need to be "joined" clientside.

### 1.0.155 - 2018-02-28	
Fixed wrong name used on expand one > many and many > many expand for get method in xrmContextService

### 1.0.153 - 2018-02-23

XrmAccess can be resolved lazy. Parse true to the XrmAccess constructor in the prototype instance, and call xrmContextService.applyAccess(prototype, instance) when you
need to know the defacto access for current user on the instance. If you do not parse anything to the constructor of XrmAccess on you prototype, access will be
resolved as an automatic request after fetch of an instance through get or query.

### 1.0.152 - 2018-02-22

Introduction of XrmAccess to support ui that needs to know the current access abilities for the current user on an object instance.

### 1.0.151 - 2018-02-19
Development and bug fix has been moved into the poc sub project, so changes and fixes can be done locally and tested without push to the npm.
This should result in fewer and more stable releases, and easy up the development and bug fix.

Current "stable" build is hosted in Web/kipon-xrmservice
Current "nightly build" is hosted in Web/Poc/src/app/xrm


### 1.0.151 - 2018-02-19

fixed Filter does not have a value for ContainsData and NotContainsData Comparator. No longer giving ...undefined error

### 1.0.149 - 2018-02-17

XrmTransaction introduced to allow bundle independent operation into a single transaction.  
To commit the transaction, use xrmContextService.commit(transInstance);

createAll ATTENTION, API changed!!, it is not longer returning an array of keys, but it still set the id of the parsed instance according to creation
putAll
deleteAll

all refactored to use XrmTransaction internally

### 1.0.146 - 2018.02.17

XrmStateService introduced to enable monitoring of activites in the XrmService. Please look in the npm documentation page for the module for details. It basically
enable you to draw a spinner in your UI when the XrmService (or XrmContextService) is active talking to Dynamics 365.

xrmContextService changemanager was out of office since version 1.0.130 preventing any context based update of an object, it is fixed now

xrmContextService.clone(..) is now cloning Date, EntityReference, OptionSetValue, so updating one instance after clone will not impact other instances
cloned from the same source.

### 1.0.130 - 2018.02.16

added POC code for deleteAll() 
added POC code for createAll()

xrmContextService.deleteAll(instance[]) -- Delete multi row in a single transaction.
xrmContextService.putAll(prototype,instances[], field, value) -- allow put same value into a number of rows in a single transaction. The process will also put the value into the parsed instance to keep ui sync
xrmContextService.createAll(prototype, array)  -- allow create multi records of same time in one transaction.


xrmSErvice.clone (clone method based on defined prototype   returns a clone on the parsed entity, based on the parsed prototype. Makes it easy to copy an object if
multi line create is needed, based on single input)

Strip { and } when Condition filter on reference fields.

$devClientUrl() returning wrong url when running with CRM

debug url to console on delete

service-generator, setting the decimal default directly in the prototype property definition was not the best idea, because it
also impact the default when using new MyEntity(),  therefore the generator now generates a meta() method on the entity
that is setting these values.


### 1.0.101 - 2018-02-13

handle xrmContextService put a decimal value without decimal, causing Int32 => Decimal case error in the dynamics web api. 
Solution is a hack in the xrmContextService, adding 0.0000000001 to the value send to dynamics before sending.
fields that require this must be defined in the prototype with the value, ex. as   myentity_mydecimalfield: number = 0.0000000001;

fixed the service generator to auto generate these stupid numeric metadata instead of just setting the values to null.

### 1.0.100 - 2018-02-13

introduced $devclienturl(): string in XrmContext to support different url in local developer mode, compared with value when running inside xrm.
$devclienturl() of XrmContext is used internally in XrmContextService when it needs to know the real origin url of CRM

support for put EntityReference in xrmContextService and xrmService.put, enable put and delete of entityrefrences values

put null value in xrmService (and xrmContextService) will map to delete property value on entity request, to keep consistance and simplicity on setting a value to null

fixed wrong url on put and add put method to xrmContetService

### 1.0.91 - 2018-02-12

xrmContextService.context and xrmContextService.changemanager made private

Handling 8.0 not able to return object on update. The initial object will be returned (result is that calculated fields are not updated according to server), 
and the changemanagement cache is updated according to the client side object already in place from the client.

### 1.0.89 - 2018-02-09

Handling 8.0 not able to return object on create, will return { id : 'newid', $$keyonly = true } instead. This allow the client to fetch the line in such situation
Crm 8.0 does not support return=representation for create message :-((.

XrmContextService resolved wrong record on create
add         headers = headers.append("Prefer", "return=representation") to xrmService.create


### 1.0.78 - 2018-02-09

Owner generated wrong syntax in service-generator

xrmService.debug = true, will write generated url to console, both for XrmService instance and XrmContextService instance

### 1.0.76 - 2018-02-08

XrmContext.getUserName() and XrmContext.getUserId() made visible in the XrmContext interface.

The default XrmContext, returned when no context found (only used when running in developer mode outside Dynamics 365), 
will use the "whoami" web api call to resolve the current user,
while the xrm.page.context methods will be used, if the application is running inside Dynamics 365 WebResources. This
can give a slight delay in regards to when getUserId() is available in the developer mode and getUserName() is returning a hardcoded string.

XrmContextService - Comparator
Comparator.StartsWith, Comparator.EndsWith,  and NotNNN. for Container, Startwith and EndsWith implemented.

### 1.0.73 - 2018-02-07 14:35 GMT+1

Fix XrmContextService Condition filter on number and boolean fields

### 1.0.72 - 2018-02-07 14:00 GMT+1

Added isActive and isInactive as shortcut method on Condition

Suggest OptionSetValue for field type State and Status in service generator