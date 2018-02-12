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