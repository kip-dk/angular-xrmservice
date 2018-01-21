import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

export interface XrmContext {
    getClientUrl(): string;
    getQueryStringParameters(): any;
    getVersion(): string;
}

export class XrmEntityKey {
    id: string;
    entityType: string;
}

export interface XrmQueryResult<T> {
    pages: string[];
    pageIndex: number;
    top: number;
    nextLink: string;
    context: string;
    count: number;
    value: T[];
    prev(): Observable<XrmQueryResult<T>>;
    next(): Observable<XrmQueryResult<T>>;
}

export class Expand {
    name: string;
    select: string;
    filter: string;
}



@Injectable()
export class XrmService {
    apiUrl: string = '/api/data/v8.2/';

    constructor(private http: HttpClient) {
        let v = this.getContext().getVersion().split('.');
        this.setVersion(v[0] + "." + v[1]);
    }

    setVersion(v: string): void {
        this.apiUrl = this.apiUrl.replace("8.2", v);
    }

    getContext(): XrmContext {
        if (typeof window['GetGlobalContext'] != "undefined") {
            let x = window['GetGlobalContext']();
            if (x.getVersion == undefined) {
                x.getVersion = (): string => "8.0.0.0"
            }
            return x;
        }

        if (window['Xrm'] != null) {
            var x = window["Xrm"]["Page"]["context"] as XrmContext;
            if (x != null) {
                if (x.getVersion == undefined) {
                    x.getVersion = (): string => "8.0.0.0"
                }
                return x;
            }
        }

        if (window.parent != null && window.parent['Xrm'] != null) {
            var x = window.parent["Xrm"]["Page"]["context"] as XrmContext;
            if (x != null) {
                if (x.getVersion == undefined) {
                    x.getVersion = (): string => "8.0.0.0"
                }
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
            },
            getVersion(): string {
                return "8.0.0.0";
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
    get<T>(entityTypes: string, id: string, fields: string): Observable<T>;
    get<T>(entityTypes: string, id: string, fields: string, expand: Expand): Observable<T>;
    get<T>(entityTypes: string, id: string, fields: string, expand: Expand = null): Observable<T> {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers = headers.append("OData-MaxVersion", "4.0");
        headers = headers.append("OData-Version", "4.0");
        headers = headers.append("Content-Type", "application/json; charset=utf-8");
        headers = headers.append("Prefer", "odata.include-annotations=*");

        let options = {
            headers: headers
        }

        let addFields = '';
        let sep = '?';

        if (fields != null && fields != '') {
            addFields = sep + "$select=" + fields;
            sep = '&';
        }

        let _ex = this.expandString(expand, sep);

        let _id = id.replace("{", "").replace("}", "");

        return this.http.get<T>(this.getContext().getClientUrl() + this.apiUrl + entityTypes + "(" + _id + ")" + addFields + _ex, options).map(response => response);
    }

    query<T>(entityTypes: string, fields: string, filter: string): Observable<XrmQueryResult<T>>;
    query<T>(entityTypes: string, fields: string, filter: string, orderBy: string): Observable<XrmQueryResult<T>>;
    query<T>(entityTypes: string, fields: string, filter: string, orderBy: string, top: number): Observable<XrmQueryResult<T>>;
    query<T>(entityTypes: string, fields: string, filter: string, orderBy: string, top: number, count: boolean): Observable<XrmQueryResult<T>>;
    query<T>(entityTypes: string, fields: string, filter: string, orderBy: string = null, top: number = 0, count: boolean = false): Observable<XrmQueryResult<T>> {
        let me = this;
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers = headers.append("OData-MaxVersion", "4.0");
        headers = headers.append("OData-Version", "4.0");
        headers = headers.append("Content-Type", "application/json; charset=utf-8");
        headers = headers.append("Prefer", "odata.include-annotations=\"*\"");
        if (top > 0) {
            headers = headers.append("Prefer", "odata.maxpagesize=" + top.toString());
        } else {
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
            url += '$select=' + fields;
            sep = '&';
        }

        if (filter != null && filter != '') {
            url += sep + '$filter=' + filter;
            sep = '&';
        }

        if (orderBy != null && orderBy != '') {
            url += sep + '$orderby=' + orderBy;
            sep = '&';
        }

        if (count) {
            url += sep + '$count=true';
            sep = '&';
        }

        return this.http.get(url, options).map(response => {
            let result = me.resolveQueryResult<T>(response, top, [url], 0);
            return result;
        });
    }

    create<T>(entityType: string, entity: T): Observable<T> {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers = headers.append("OData-MaxVersion", "4.0");
        headers = headers.append("OData-Version", "4.0");
        headers = headers.append("Content-Type", "application/json; charset=utf-8");
        headers = headers.append("Prefer", "odata.include-annotations=*");
        let options = {
            headers: headers
        }
        return this.http.post<T>(this.getContext().getClientUrl() + this.apiUrl + entityType, entity, options).map(response => response);
    }

    update<T>(entityType: string, entity: T, id: string): Observable<T>;
    update<T>(entityType: string, entity: T, id: string, fields: string): Observable<T>;
    update<T>(entityType: string, entity: T, id: string, fields: string = null): Observable<T> {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers = headers.append("OData-MaxVersion", "4.0");
        headers = headers.append("OData-Version", "4.0");
        headers = headers.append("Content-Type", "application/json; charset=utf-8");
        headers = headers.append("Prefer", "odata.include-annotations=*");
        if (fields != null) {
            headers = headers.append("Prefer", "return=representation");
        } 

        let options = {
            headers: headers
        }

        let _f = '';
        if (fields != null) {
            _f = '?$select=' + fields;
        }
        return this.http.patch<T>(this.getContext().getClientUrl() + this.apiUrl + entityType + "(" + id + ")" + _f, entity, options).map(response => response);
    }

    put<T>(entityType: string, id: string, field: string, value: any): Observable<T> {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers = headers.append("OData-MaxVersion", "4.0");
        headers = headers.append("OData-Version", "4.0");
        headers = headers.append("Content-Type", "application/json; charset=utf-8");
        headers = headers.append("Prefer", "odata.include-annotations=*");
        let options = {
            headers: headers
        }
        let v = {
            value: value
        };

        let url = this.getContext().getClientUrl() + this.apiUrl + entityType + "(" + id + ")" + field;
        console.log(url);

        return this.http.put<T>(url, v, options).map(response => response);
    }

    delete(entityType: string, id: string): Observable<null> {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers = headers.append("OData-MaxVersion", "4.0");
        headers = headers.append("OData-Version", "4.0");
        headers = headers.append("Content-Type", "application/json; charset=utf-8");
        headers = headers.append("Prefer", "odata.include-annotations=*");
        let options = {
            headers: headers
        }
        return this.http.delete(this.getContext().getClientUrl() + this.apiUrl + entityType + "(" + id + ")").map(response => null);
    }

    private expandString(expand: Expand, sep: string): string {
        if (expand == null || expand.name == null || expand.name == '') return '';

        let _ex = sep + '$expand=' + expand.name;
        if (expand.select != null || expand.filter != null) {
            _ex += '(';
            let semi = '';
            if (expand.select != null) {
                _ex += '$select=' + expand.select;
                semi = ';'
            }
            if (expand.filter != null) {
                _ex += semi + '$filter=' + expand.filter;
            }

            _ex += ')';
        }
        return _ex;
    }

    private resolveQueryResult<T>(response: any, top: number, pages: string[], pageIndex: number): XrmQueryResult<T> {
        let me = this;
        let result = {
            context: response["@odata.context"],
            count: response["@odata.count"],
            value: response["value"] as T[],
            pages: pages,
            prev: null,
            next: null,
            pageIndex: pageIndex,
            top: top,
            nextLink: null
        }

        let nextLink = response["@odata.nextLink"] as string;

        if (nextLink != null && nextLink != '') {
            let start = nextLink.indexOf('/api');
            nextLink = me.getContext().getClientUrl() + nextLink.substring(start);
            result = {
                context: result.context,
                count: response["@odata.count"],
                value: result.value,
                pages: pages,
                pageIndex: pageIndex,
                prev: null,
                top: top,
                nextLink: nextLink,
                next: (): Observable<XrmQueryResult<T>> => {
                    let headers = new HttpHeaders({ 'Accept': 'application/json' });
                    headers = headers.append("OData-MaxVersion", "4.0");
                    headers = headers.append("OData-Version", "4.0");
                    headers = headers.append("Content-Type", "application/json; charset=utf-8");
                    headers = headers.append("Prefer", "odata.include-annotations=\"*\"");
                    if (top > 0) {
                        headers = headers.append("Prefer", "odata.maxpagesize=" + top.toString());
                    } 

                    let options = {
                        headers: headers
                    }
                    return me.http.get(nextLink, options).map(r => {
                        pages.push(nextLink);
                        let pr = me.resolveQueryResult<T>(r, top, pages, pageIndex + 1);
                        return pr;
                    })
                }
            }
        }

        if (result.pageIndex >= 1) {
            result.prev = (): Observable<XrmQueryResult<T>> => {
                let headers = new HttpHeaders({ 'Accept': 'application/json' });
                headers = headers.append("OData-MaxVersion", "4.0");
                headers = headers.append("OData-Version", "4.0");
                headers = headers.append("Content-Type", "application/json; charset=utf-8");
                headers = headers.append("Prefer", "odata.include-annotations=\"*\"");
                if (top > 0) {
                    headers = headers.append("Prefer", "odata.maxpagesize=" + top.toString());
                } else {
                }

                let options = {
                    headers: headers
                }

                let lastPage = result.pages[result.pageIndex - 1];
                return me.http.get(lastPage, options).map(r => {
                    result.pages.splice(result.pages.length - 1, 1);
                    let pr = me.resolveQueryResult<T>(r, top, result.pages, result.pageIndex - 1);
                    return pr;
                })
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
