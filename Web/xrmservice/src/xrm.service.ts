import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

export interface XrmContext {
    getClientUrl(): string;
}


@Injectable()
export class XrmService {
    private apiUrl = '/api/data/v8.2/';

    constructor(private http: HttpClient) {
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

    get<T>(entityTypes: string, id: string, fields: string): Observable<T> {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers.append("OData-MaxVersion", "4.0");
        headers.append("OData-Version", "4.0");
        headers.append("Prefer", "odata.include-annotations=*");

        let options = {
            headers: headers
        }

        let addFields = '';
        if (fields != null && fields != '') {
            addFields = "?$select=" + fields;
        }

        let _id = id.replace("{", "").replace("}", "");

        return this.http.get<T>(this.getContext().getClientUrl() + this.apiUrl + entityTypes + "(" + _id + ")", options);
    }
}
