import { Component } from '@angular/core';

import { XrmService } from 'kipon-xrmservice';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  constructor(private xrmService: XrmService) {
      this.title = xrmService.hello();
  }
}
