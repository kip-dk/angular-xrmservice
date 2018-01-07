import { Injectable } from '@angular/core';

export interface XrmContext {
    getClientUrl(): string;
}

@Injectable()
export class XrmService {

    constructor() {
    }

    getContext(): XrmContext {
        if (window['Xrm'] != null) {
            var x = window["Xrm"]["Page"]["context"] as XrmContext;
            if (x != null) {
                return x;
            }
        }

        if (window.parent != null && window.parent['Xrm'] != null) {
            var x = window.parent["Xrm"]["Page"]["context"] as XrmContext;
            if (x != null) {
                return x;
            }
        }
        return {
            getClientUrl(): string {
                return "http://localhost:4200";
            }
        };
    }
}
