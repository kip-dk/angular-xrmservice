#2.3.1 - 2020-05-14
Implemented EXPERIMENTAL support for fetchxml on xrmcontextservice. To support more advanced query, a fetchxml(entity: Entity, xml: string ) has been introduced. On top, a Fethxml class
has been added to enable building the fetchxml using Condition etc. The api is experimental, and for now only smaller queries are supported (no fallback to to $batch for large has been implemented yet).
Entities received from fetchxml has same nature as received by normal api, and all patterns applied by the query(..) method is also applied on result from fetchxml, including object caching on id.

#2.3.0 - 2020-03-16
Removed support for version 8.2 of CRM. The support for version 8.2 installation is complicating the version management between the url posted
and the @odata.link fields, and is giving errors on earlier version of the framework on Dynamics 365 online 9.1 installation. Therefore we have decided to stop
the support for CRM 8.2 from the start of version 2.3.0. If you need support for Dynamics 365 version 8.2, do NOT update beyond version 2.2.19.

#2.2.19 - 2020-02-21
IE and Edge is sometime giving cross script error "Can't execute code from a freed script". This issue is caused by the fact that the framework is keeping a long living reference to the
initiating page Xrm instance to have access to clienturl, formtype and more. To solve this issue, the way xrmservice is communicating with its parent frame or opener is changed, so information
is stored locally it its own "window"["variable"], and the occurance of cross frame/popup scripting is reduced to a minimum, and only occure once per function, and the parent/opener function is
only used to initialize the corresponding values in the child/popup window.

#2.2.18
Constructor on EntityReference has been extended to support creating full valid references through the constructor, so you do not need to manually assign pluralName and assocationnavigation property after
creating the etityreference instance.

ToEntityReference(associationnavigationproperty: string) has been added to Entity. The purpuse is to make it easy to assign an assosiationproperty a value from an instance of an entity.

Be aware, if you assign a reference field on an entity with this method, you MUST parse
the associationnavigationproperty related to that specific field, otherwise a create/update operation will fail. An entity reference must map to an OData navigation property on the form

{associationnavigationproperty}@odata.bind = /{entity.pluralName}(entity.id), and the associationnavigationproperty is not the same name as the property name, so for the framework to create this map,
the name of the associationnavigationproperty is needed.

#2.2.17
Comparator.DoesNotContainsData gave null ref exception for date fields.

Below might give slightly different behavior on some conditions, due to "smart-convert" null values to natural conditions. The  former code would
proberbly throw and an exception, so it is unlikely it will change anything.

Auto convert Equals compareator with null value to DoesNotContainsData
Auto convert NotEquals comparator with null value to ContainsData

#2.2.15
Resolve to same server url, if "webresources" is contained in the url.

#2.2.14
onFetch (and other entity property methods) was not populated (and triggered) when using angular 8. The root cause is due to angular 8 running ES6 if the browser supports it
and the return from for (var prop in obj) has different behavior in ES5 and ES6. This issue has been fixed in version 2.2.14

#2.2.13
Condition for XrmContextService now support "raw filtering". This means that you can add any filter to the condition using a simple string. The advantage is that this will
allow you to add filters that are not directly supported by the XrmContextService, but is supported by the Webapi.

The disadvantage of this method is obviously that you have to concatenate the string values into a valid condition your self. You can combine raw with supported conditions.

#2.2.11
Deep iframing took a couple of tries to get to work within dynamics 365. It is now tested and works as expected.

First of all, the context will be found in the parent or opener, and expose there, for any sub-iframe loading. This allow deployment angular aplication within each other using iframes.
I do not encourage the use of this pattern. Having multi components in a single angular application is a better pattern, but in some rare situations it might be relevant to take this approach,
and now it works.

As for getCurrentKey() that will also look up the link of iframes to find the key, but you must call the method in each iframe, because that will populate the needed methods to be available for child iframes.

If you need a child to work on another key than the parent, you must parse id and typename as url parameters.

Beside this, some minors and getting access level, did not work, when running as a webresource from CRM has been solved.

#2.2.9
Support for deep iframing. If you have an angular app. populated as a webresources, and within such app creates another iframe, also running an app using the xrmservice, the later
would get a wrong context, and direct any call to localhost:4200 because it was unable to resolve the context correctly. This has been solved by letting each page expose
window["GetGlobalContext"] to be the context it is using it self. 

Same level of sharing goes for getCurrentKey() because window["Xrm"] is also shared same way. If your inner iframe need to target another object than the outer, you MUST populate
id and typename to be used in the inner frame on the url for the inner frame, oterwise the inner frame will use the same entity id as the outer.

The misspelling of the getCurrentKey method on xrmService has been fixed, and the wrong spelling (getCurrenKey) as been deprecated.

#2.2.5 - 2.2.8 Force https and test token
These two versions does not add any new. The api on xrmservice is exposing "token". If you set this, before any other call to xrmService or xrmContext service,
this token will be put into any call in the Bearer authentication header. You can use ADAL.js or MSAL.js (there is an angular version for the later) to
get a token and parse it into your xrmContext. This allow you to do real SPA application that runs outside Dynamics 365. 

The token has been there all the time, but now it is populated.

Secondly you now have a foceHttps method on the xrmService. This is convinient if you have an onprem. dev environment running http, but for some reason, you need it to
run https even though the installation has been installed with http. This has been proven to work, where i needed to test integration between Graph api and Dynamics 365.
Call it before any other method on the service, and http:// will be changed to https:// before any call to CRM.


#2.2.4
all http operations is now adding headers to the crm dynamics 365 web api. This enable a very simple implementation of SPA running outside Dynamics 365. 

The first draft of this, you can install MSAL.js alongside kipon-xrmservice, and then simply set token of the xrmservice according to the return from get token.

Be aware that the api for this functionallity migh change in upcomming version, where a more smoot SPA outside dynamics 365 implementation will be provided.

### 2.2.0

Date in filter valuess are now supported.


MetadataService, witch was an undocumented feature of KiponXrmserviceModule has been moved out of this module, and into its own module
KiponXrmMetadataModule. If you are using the MetadataService, from the 2.1.x version of this library, you need to import KiponXrmMetadataModule
explicit in your application, and replace MetadataService with XrmMetadataService. If you do not explicitly use this service on your code,
everything should be fine.


### 2.1.14

url encode values parsed to condtion in xrmcontext service

### 2.1.4 
Added KiponXrmAnnotationModule, a simple module with XrmAnnotationService to perform
task related to notes.

To support this module, Entity class has been extended with _logicalName. In most cases
this variable is set correctly by the implementation from the keyname. In rare cases this
will end up being the wrong name. In such case, the constructor of the entity used to
create the prototype can include the correct logical name.

### 2.1.3
Added KiponXrmSecurityModule, a simple module with XrmSecurityService to perform simple
security tasks. This module is optional.

### 2.1.2
Handle Date in put

### 2.1.1
Strip ref fields from {} when parsed as condition.

### 2.1.0
Upgraded to angullar 7.

### 2.0.4
Fixed removing {} when entity refr. fields was added to condition, direclty with _FIELDNAME_value syntax.

Fixed condition on entity key. If an entity is fetch with filter, directly on the key column, it will be parsed correctly.
(it is always better to use get(..) in this situation, but now at least it works if you for some reason prefer to use query to fetch a unique record)

### 2.0.2

Fixed removing {} on create / update record with entity reference. They will be removed automatically if they are there.

npm documentation updated.

### 2.0.0

upgrade to angular 6

If you need old version use kipon-xrmservice@1.3.1

If you need support for angular 5 and below, do not take version higher than 1.3.x. Version 2.0.x has been upgrade to use newest version of rxjs patterns.
In the git repository, a new sub folder (v2) has been created that hosts the angular 6 version of the library. The library has been created from
scratch, using the newest version on angular cli, and all Http activities has been changed to use the newest rxjs. This change is NOT compliant with
angular below version 6.

### 1.3.1
Support for action in xrmService and xrmContextService. For now, no support for action i transactions, but i will add that shortly.

### 1.2.11
Include IsActivity in metadata.service EntityMeta and use the setting in the service-generator to set key name correct for entities of type activity when
generating services.

### 1.2.10
MetadataService now support fetch of ManyToManyRelationsships. This has been introduced so the service-generator can generate these properties. 

The service-generator solutions has been updated with facility to generate M:M properties than will be resolved on get() on the xrmContextService.
This part of the code generator is also a nice demonstration on how to define M:M properties on your entity prototype class.

### 1.2.6
Support for M:M relationship management directly on entity object.

If you define a property of type Entities<T extends Entity>, where the name correspond to the M:M schema name, and your prototype defines the detail on the relationship,
you can now use add(entity) and remove(entity) directly on the M:M property.  

For now, look into the POC project, and see how opportunity : competitor relationship has been defined, and how elements are associated and disassociated.

### 1.2.5

Version 1.2.1 - 1.2.4 are versions not to be used, needed to get introduction of XrmConfigService to work without breaking old implementation not using the feature.
These versions has breaking changes that are fixed in 1.2.5, so if you run into trouble, please try to upgrade to 1.2.5, breaking changes has been fixed, and
1.2.5 is compatible with 1.2.0.

XrmConfigService allow you to configure the default url for CRM. If you run the application inside Dynamics 365 as a web resource, the context is giving, but running
ex. in developer mode, using ng serve, this concept would always fall back to http://localhost:4200. This is still the default behavior, but you can now configure
the url. The README page of the npm package will describe how.

This configuration facility has two goals. 

1) Add the ability to run the application using ng serve, without using the proxy concept of angular, but simple call the correct url. You have to disable CORS in your browser and
manually authenticate against CRM in the same browser window, before you navigate to your test page.
2) This is also the first step in implementing authentication support based and adal.js. This part is however still work in progress.

### 1.2.0

XrmContextService expand now supports expanding multi properties on get. The POC project contains an example how it is done. Simply ensure that your prototype has a defined
value corresponding to the type of related entities. Remember $expand only supports lookup (M:1) and many to many (M:M).


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