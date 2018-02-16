###

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