import { Injectable } from '@angular/core';

@Injectable()
export class XrmService {

    constructor() {
    }

    hello(): string {
        return 'hello from xrm service';
    }

}
