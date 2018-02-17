# xrmservice
This is the git repository for a simple Dynamics 365 Web API wrapper for angular 4 and 5.

## Installation

To install this library, run:

```bash
$ npm install kipon-xrmservice --save
```

### Documentation
Follow the link to the npm package for a full documentation

XrmService (a simple map of plain Dynamics 365 Web Api calls): <br />

[goto npm package view](https://www.npmjs.com/package/kipon-xrmservice)

XrmContextService (a Web API programming model based on typescript prototypes): <br />

[Go to the XrmCContextService documentation page](https://github.com/kip-dk/angular-xrmservice/blob/master/Web/kipon-xrmservice/XRMCONTEXTSERVICE.MD)

### Changelog - last update 2018-02-17
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


## License

MIT © [Kipon ApS, 2018](mailto:kip@kipon.dk)