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

```bash
$ npm install kipon-xrmservice
```

and then from your Angular `AppModule`:

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
	XrmServiceModule,
    LibraryModule
  ],
  providers: [ XrmService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```


## License

MIT © [Kjeld Poulsen](mailto:kip@kipon.dk)
