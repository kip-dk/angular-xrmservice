import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

export interface XrmContext {
    getClientUrl(): string;
    getQueryStringParameters(): any;
}

export class XrmEntityKey {
    id: string;
    entityType: string;
}


@Injectable()
export class XrmService {
    private apiUrl: string = '/api/data/v8.2/';

    constructor(private http: HttpClient) {
    }

    setVersion(v: string): void {
        this.apiUrl = this.apiUrl.replace("8.2", v);
    }

    getContext(): XrmContext {
        if (typeof window['GetGlobalContext'] != "undefined") {
            return window['GetGlobalContext']();
        }

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
            },
            getQueryStringParameters(): any {
                let search = window.location.search;
                let hashes = search.slice(search.indexOf('?') + 1).split('&');
                let params = {};
                hashes.map(hash => {
                    let [key, val] = hash.split('=')
                    params[key] = decodeURIComponent(val)
                })
                return params;
            }
        };
    }

    getCurrenKey(): Observable<XrmEntityKey> {
        console.log('ver 0.2.8');
        let params = this.getContext().getQueryStringParameters();
        let result = new XrmEntityKey();
        result.id = params["id"];
        result.entityType = params["typename"];

        if (result.id != null) {
            result.id = decodeURIComponent(result.id).replace('{', '').replace('}', '');
            if (result.entityType === 'undefined' ||result.entityType == null || result.entityType == '') {
                result.entityType = this.getQueryStringParameters()["typename"];
            }
            return new Observable<XrmEntityKey>(obs => obs.next(result));
        }

        if (window.parent && window.parent["Xrm"] && window.parent["Xrm"]["Page"] && window.parent["Xrm"]["Page"]["ui"]["getFormType"] && window.parent["Xrm"]["Page"]["ui"]["getFormType"]() == 2) {
            result.id = window.parent["Xrm"]["Page"]["data"]["entity"]["getId"]();
            result.entityType = window.parent["Xrm"]["Page"]["data"]["entity"]["getEntityName"]();

            if (result.id != null) {
                result.id = decodeURIComponent(result.id).replace('{', '').replace('}', '');
                if (result.entityType === 'undefined' || result.entityType == null || result.entityType == '') {
                    result.entityType = this.getQueryStringParameters()["typename"];
                }
                return new Observable<XrmEntityKey>(obs => obs.next(result));
            }

            return new Observable<XrmEntityKey>(obs => {
                let intervalThread = setInterval(() => {
                    result.id = window.parent["Xrm"]["Page"]["data"]["entity"]["getId"]();
                    result.entityType = window.parent["Xrm"]["Page"]["data"]["entity"]["getEntityName"]();
                    if (result.id != null) {
                        clearInterval(intervalThread);
                        result.id = decodeURIComponent(result.id).replace('{', '').replace('}', '');
                        if (result.entityType === 'undefined' || result.entityType == null || result.entityType == '') {
                            result.entityType = this.getQueryStringParameters()["typename"];
                        }
                        obs.next(result);
                    }
                }, 800);
            });
        } else {
            return new Observable<XrmEntityKey>(obs => obs.next(result));
        }
    }

    get<T>(entityTypes: string, id: string, fields: string): Observable<T> {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers.append("OData-MaxVersion", "4.0");
        headers.append("OData-Version", "4.0");
        headers.append("Content-Type", "application/json; charset=utf-8");
        headers.append("Prefer", "odata.include-annotations=*");

        let options = {
            headers: headers
        }

        let addFields = '';
        if (fields != null && fields != '') {
            addFields = "?$select=" + fields;
        }

        let _id = id.replace("{", "").replace("}", "");

        return this.http.get<T>(this.getContext().getClientUrl() + this.apiUrl + entityTypes + "(" + _id + ")" + addFields, options);
    }

    query<T>(entityTypes: string, fields: string, filter: string): Observable<T[]>;
    query<T>(entityTypes: string, fields: string, filter: string, orderBy: string): Observable<T[]>;
    query<T>(entityTypes: string, fields: string, filter: string, orderBy: string, top: number): Observable<T[]>;
    query<T>(entityTypes: string, fields: string, filter: string, orderBy: string = null, top: number = 250, page: number = 1): Observable<T[]> {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers.append("OData-MaxVersion", "4.0");
        headers.append("OData-Version", "4.0");
        headers.append("Content-Type", "application/json; charset=utf-8");
        headers.append("Prefer", "odata.include-annotations=*");

        let url = this.getContext().getClientUrl() + this.apiUrl + entityTypes;


        return null;
    }

    private getQueryStringParameters(): any {
        let search = window.location.search;
        let hashes = search.slice(search.indexOf('?') + 1).split('&');
        let params = {};
        hashes.map(hash => {
            let [key, val] = hash.split('=')
            params[key] = decodeURIComponent(val)
        })
        return params;
    }
}
