# kipon-xrmservice version 2.0.0

kipon-xrmservice has been upgrade to use angular 6. If you need it to work with angular 4 or 5, please use version 1.3.1


## What is kipon-xrmservice
kipon-xrmservice is an angular 6 library that makes it easier to work with Microsoft Dynamics 365 web api. 

## Installation
To install this library, run:

```bash
$ npm install kipon-xrmservice --save
```

and then include the KiponXrmServiceModule and XrmService in your `AppModule`:

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule, APP_INITIALIZER } from '@angular/core';

import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { KiponXrmserviceModule, XrmInterceptor } from 'kipon-xrmservice';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    KiponXrmserviceModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: XrmInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```


## API
Comming soon - stated on (2018 july 10). I am in process of updating the API for the angular 6 version of the library, but

The basic api is the same as the angular 4, 5 version, but now you only have to import "KiponXrmserviceModule" into your main module.
Please see above example.

To see the full documentation of methods, use the old guide for now:

[View the api from the angular 4,5 lib](https://github.com/kip-dk/angular-xrmservice/blob/master/Web/kipon-xrmservice/README.MD)

## License
MIT © [Kipon ApS, 2018](mailto:kip@kipon.dk)
