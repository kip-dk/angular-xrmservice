# xrmservice
This is the git repository for a simple Dynamics 365 Web API wrapper for angular 6.

If you need it to run under version 4 or 5 you must use npm version 1.3.x.

## Installation

To install this library, run:

```bash
$ npm install kipon-xrmservice --save
```

### Library offer
* A simple yet powerfull service that makes it easier to work with Dynamics 365 Web API, when building angular based WebResources
* A very basic service (XrmService) that simply map string to angular HttpClient requests
* A programming model (XrmContextService) where you can build angular based services to access your Dynamics 365 data, based on TS prototypes that maps to Dynamics 365 entities.
	* All CRUD  and PUT (single property update) operations, including get single record, and multi select
	* Simplifying entity key, by streamlining all keys to be named "id".
	* Map complex properties to strong type TS object: Date, OptionSetValue and EntityReference
	* Fast track to get access to the Xrm.page.context
	* Fast track to get key of current object
	* A simple condition mechanism to define queries
	* Change management on object, allowing your components to change properties and after that simply call xrmContextService.update(yourinstance). Only properties that was changed will be included in the update request.
	* Transactions (do multi operations in one request, and guaranteed, all success or nothing done).
	* Access user permission on objects
* A simple Dynamics 365 solution you can use to generate initial entity services, easy to extend with real functionality.
* Support for ng serve proxy access to Dynamics 365, enable you to develop and test, without prior deployment to a Dynamics 365 instance. 


### Documentation
Follow the link to the npm package for a full documentation

XrmService (a simple map of plain Dynamics 365 Web Api calls): <br />

[goto npm package view](https://www.npmjs.com/package/kipon-xrmservice)

XrmContextService (a Web API programming model based on typescript prototypes): <br />

[Go to the XrmContextService documentation page](https://github.com/kip-dk/angular-xrmservice/blob/master/Web/kipon-xrmservice/XRMCONTEXTSERVICE.MD)

### Changelog - last update 2018-11-25
[Go to changelog](https://github.com/kip-dk/angular-xrmservice/blob/master/CHANGELOG.MD)

## The project
This project contains three sub projects, all related to the XrmService implementation:

### Web > v2
The root folder for the applications and libraries, based on angular 6.

v2/kipon-xrmservice: This is the POC test application.<br />
v2/kipon-xrmservice/projects/kiipon-xrmservice: This is the angular library, published to npm.<br />


### Web > service-generator
(the service generator has not yet been migrated to angular 6, but it still works, and the services generated will also work with version 2.0 of the kipon-xrmservice library)

This source contains an angular 5 application that can generate a basic entity service, based on the XrmContextService. Below you find link to download a version 8.0 or 8.2 (will also work with 9.0)
managed solution, containing the generator. Import the solution to your sandbox environment, and open the configuration page in the solution to start generate a service:<br />

[Dynamics 365 8.0 XrmService genereator](https://github.com/kip-dk/angular-xrmservice/blob/master/Web/kipon-xrmservice/XrmContextServiceGenerator_target_CRM_8.0_managed.zip) <br />
[Dynamics 365 8.2 XrmService genereator](https://github.com/kip-dk/angular-xrmservice/blob/master/Web/kipon-xrmservice/XrmContextServiceGenerator_managed.zip) <br />

### Local development
If you have an onpremise installation of Dynamics 365 for development purpose, and you wish to do development using ng serve, the only thing you need to do is enable basic authentication
on your local Dynamics 365 installation, and then setup the proxy.config.json for your project. Look into the v2/kipon-xrmservice project for an example. You will find a "proxy.config.json" where you
can see how to setup the proxy, and a "run.cmd" file to see how to start your project.

You will need to enable basic authentication on your Dynamics 365 web service instance in the IIS Manager.

If you are developing against an online installation, you have to configure the service url.

This is done like this:

```typescript
import { XrmServiceModule, XrmStateService, XrmService, XrmContextService, XrmInterceptor, XrmConfigService } from 'kipon-service'

const xrmInitializerFn = (appConfig: XrmConfigService) => {
  return () => {
    return appConfig.loadAppConfig('/assets/xrmConfig.json');
  };
};

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
      KiponXrmServiceModule
  ],
  providers: [
      {  provide: APP_INITIALIZER, useFactory: xrmInitializerFn, multi: true, deps: [XrmConfigService] },
      { provide: HTTP_INTERCEPTORS, useClass: XrmInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

and the place a file xrmConfig.json in the assets folder:

```json
{
  "tenant": "",
  "clientId": "",
  "postLogoutRedirectUri": "",
  "endpoints": { "orgUri": https://yourinstance.crm.dynamics.com },
  "cacheLocation": "",
  "version":  "v8.2"
}
```

Finally open a command prompt, and start you Chrome browser with the following command. (This will disable CORS and share the login token from another tab with your app.)<br />

```bsh
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --user-data-dir="C://Chrome dev session" --disable-web-security
```

Now login to your Dynamics 365 instance - and when done - open a new tab, and navigate to your angular app in the new tab (typically http://localhost:4200).


### Deployment
At some point, you will need to deploy your code to a Dynamics 365 instance. You can use tools like XrmToolBox for that, or your you can take a look at the tool i provided in:
[go to the angular dynamics 365 web resource guide](https://github.com/kip-dk/angular-xrm-webresource)

The service-generator folder in this project has an example on how to setup deployment, using above tool. Look in the "deploy.cmd" command line tool.

## License

MIT © [Kipon ApS, 2018](mailto:kip@kipon.dk)