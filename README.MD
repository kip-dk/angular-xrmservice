# xrmservice
This is the git repository for a simple Dynamics 365 Web API wrapper for angular 5.

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
* Support for ng serve proxy access to Dynamics 365, enable you to develop and test, without prior deployment to a Dynamics 365 instance. Currently this function require that you have an onpremise development environment.


### Documentation
Follow the link to the npm package for a full documentation

XrmService (a simple map of plain Dynamics 365 Web Api calls): <br />

[goto npm package view](https://www.npmjs.com/package/kipon-xrmservice)

XrmContextService (a Web API programming model based on typescript prototypes): <br />

[Go to the XrmContextService documentation page](https://github.com/kip-dk/angular-xrmservice/blob/master/Web/kipon-xrmservice/XRMCONTEXTSERVICE.MD)

### Changelog - last update 2018-03-16
[Go to changelog](https://github.com/kip-dk/angular-xrmservice/blob/master/CHANGELOG.MD)

## The project
This project contains three sub projects, all related to the XrmService implementation:

### Web > kipon-xrmservice
The code base for the npm module. This is the code repository for the reusable Dynamics 365 Web API angular service implementaton.

### Web > poc
This is an angular 5 demo application, testing most use-cases supported by the xrm-service library. It is a single page application, and it demonstrates both
use of XrmService directly, and the use of the XrmContextService. It is demonstrating usecases based on the standard account > contact relationship in Dynamics 365.

If you need details on setting up such application on your Dynamics 365 installation, you can fork this folder and follow my guide on builing Dynamics 365 pages
with angular. Take a look at that guide here:
[go to the angular dynamics 365 web resource guide](https://github.com/kip-dk/angular-xrm-webresource)

### Web > service-generator
This source contains an angular 5 application that can generate a basic entity service, based on the XrmContextService. Below you find link to download a version 8.0 or 8.2
managed solution, containing the generator. Import the solution to your sandbox environment, and open the configuration page in the solution to start generate a service:<br />

[Dynamics 365 8.0 XrmService genereator](https://github.com/kip-dk/angular-xrmservice/blob/master/Web/kipon-xrmservice/XrmContextServiceGenerator_target_CRM_8.0_managed.zip) <br />
[Dynamics 365 8.2 XrmService genereator](https://github.com/kip-dk/angular-xrmservice/blob/master/Web/kipon-xrmservice/XrmContextServiceGenerator_managed.zip) <br />

### Local development
If you have an onpremise installation of Dynamics 365 for development purpose, and you wish to do development using ng serve, the only thing you need to do is enable basic authentication
on your local Dynamics 365 installation, and then setup the proxy.config.json for your project. Look into the poc project for an example. You will find a "proxy.config.json" where you
can see how to setup the proxy, and a "run.cmd" file to see how to start your project.

### Deployment
At some point, you will need to deploy your code to a Dynamics 365 instance. You can use tools like XrmToolBox for that, or your you can take a look at the tool i provided in:
[go to the angular dynamics 365 web resource guide](https://github.com/kip-dk/angular-xrm-webresource)

The service-generator folder in this project has an example on how to setup deployment, using above tool. Look in the "deploy.cmd" command line tool.

## License

MIT © [Kipon ApS, 2018](mailto:kip@kipon.dk)