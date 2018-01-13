import { Injectable } from '@angular/core';
import { XrmService } from './xrm.service';


@Injectable()
export class XrmContextService {
    constructor(private xrmService: XrmService) { }

    hello(): string {
        return "hello from the xrm service context";
    }
}