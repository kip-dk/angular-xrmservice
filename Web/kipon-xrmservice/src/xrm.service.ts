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

export interface XrmQueryResult<T> {
    context: string;
    value: T[];
    next(): Observable<XrmQueryResult<T>>;
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


        return this.http.get<T>(this.getContext().getClientUrl() + this.apiUrl + entityTypes + "(" + _id + ")" + addFields, options).map(response => response);
    }

    query<T>(entityTypes: string, fields: string, filter: string): Observable<XrmQueryResult<T>>;
    query<T>(entityTypes: string, fields: string, filter: string, orderBy: string): Observable<XrmQueryResult<T>>;
    query<T>(entityTypes: string, fields: string, filter: string, orderBy: string, top: number): Observable<XrmQueryResult<T>>;
    query<T>(entityTypes: string, fields: string, filter: string, orderBy: string = null, top: number = 0): Observable<XrmQueryResult<T>> {
        let me = this;
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers.append("OData-MaxVersion", "4.0");
        headers.append("OData-Version", "4.0");
        headers.append("Content-Type", "application/json; charset=utf-8");

        if (top > 0) {
            headers.append("Prefer", "odata.include-annotations=*,odata.maxpagesize=" + top.toString() );
        } else {
            headers.append("Prefer", "odata.include-annotations=*");
        }

        let options = {
            headers: headers
        }

        let url = this.getContext().getClientUrl() + this.apiUrl + entityTypes;
        if ((fields != null && fields != '') || (filter != null && filter != '') || (orderBy != null && orderBy != '') || top > 0) {
            url += "?";
        }
        let sep = '';

        if (fields != null && fields != '') {
            url += "$select=" + fields;
            sep = "&";
        }

        if (filter != null && filter != '') {
            url += sep + "$filter=" + filter;
            sep = "&";
        }

        if (orderBy != null && orderBy != '') {
            url += sep + "$orderby=" + orderBy;
            sep = "&";
        }

        return this.http.get(url, options).map(response => {
            let result = me.resolveQueryResult<T>(response);
            return result;
        });
    }

    create<T>(entityType: string, entity: T): Observable<T> {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers.append("OData-MaxVersion", "4.0");
        headers.append("OData-Version", "4.0");
        headers.append("Content-Type", "application/json; charset=utf-8");
        headers.append("Prefer", "odata.include-annotations=*");
        let options = {
            headers: headers
        }
        return this.http.post<T>(this.getContext().getClientUrl() + this.apiUrl + entityType, entity, options).map(response => response);
    }

    update<T>(entityType: string, entity: T, id: string): Observable<T> {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers.append("OData-MaxVersion", "4.0");
        headers.append("OData-Version", "4.0");
        headers.append("Content-Type", "application/json; charset=utf-8");
        headers.append("Prefer", "odata.include-annotations=*");
        let options = {
            headers: headers
        }
        return this.http.patch<T>(this.getContext().getClientUrl() + this.apiUrl + entityType + "(" + id + ")", entity, options).map(response => response);
    }

    put<T>(entityType: string, id: string, field: string, value: any): Observable<T> {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers.append("OData-MaxVersion", "4.0");
        headers.append("OData-Version", "4.0");
        headers.append("Content-Type", "application/json; charset=utf-8");
        headers.append("Prefer", "odata.include-annotations=*");
        let options = {
            headers: headers
        }
        let v = {
            value: value
        };
        return this.http.put<T>(this.getContext().getClientUrl() + this.apiUrl + entityType + "(" + id + ")/" + field, v, options).map(response => response);
    }

    delete(entityType: string, id: string): Observable<null> {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers.append("OData-MaxVersion", "4.0");
        headers.append("OData-Version", "4.0");
        headers.append("Content-Type", "application/json; charset=utf-8");
        headers.append("Prefer", "odata.include-annotations=*");
        let options = {
            headers: headers
        }
        return this.http.delete(this.getContext().getClientUrl() + this.apiUrl + entityType + "(" + id + ")").map(response => null);
    }

    private resolveQueryResult<T>(response: any): XrmQueryResult<T> {
        let me = this;
        let result = {
            context: response["@odata.context"],
            value: response["value"] as T[],
            next: null
        }
        let nextLink = response["@odata.nextLink"];

        if (nextLink != null && nextLink != '') {
            result = {
                context: result.context,
                value: result.value,
                next: (): Observable<XrmQueryResult<T>> => {
                    return me.http.get(nextLink).map(r => {
                        return me.resolveQueryResult<T>(r);
                    })
                }
            }
        }
        return result;
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
