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
    pages: string[];
    pageIndex: number;
    context: string;
    count: number;
    value: T[];
    prev(): Observable<XrmQueryResult<T>>;
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
        headers = headers.append("OData-MaxVersion", "4.0");
        headers = headers.append("OData-Version", "4.0");
        headers = headers.append("Content-Type", "application/json; charset=utf-8");
        headers = headers.append("Prefer", "odata.include-annotations=*");

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
    query<T>(entityTypes: string, fields: string, filter: string, orderBy: string, top: number, count: boolean): Observable<XrmQueryResult<T>>;
    query<T>(entityTypes: string, fields: string, filter: string, orderBy: string = null, top: number = 0, count: boolean = false): Observable<XrmQueryResult<T>> {
        let me = this;
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers = headers.append("OData-MaxVersion", "4.0");
        headers = headers.append("OData-Version", "4.0");
        headers = headers.append("Content-Type", "application/json; charset=utf-8");
        if (top > 0) {
            headers = headers.append("Prefer", "odata.include-annotations=\"*\",odata.maxpagesize=" + top.toString());
        } else {
            headers = headers.append("Prefer", "odata.include-annotations=\"*\"");
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

    update<T>(entityType: string, entity: T, id: string): Observable<T> {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers = headers.append("OData-MaxVersion", "4.0");
        headers = headers.append("OData-Version", "4.0");
        headers = headers.append("Content-Type", "application/json; charset=utf-8");
        headers = headers.append("Prefer", "odata.include-annotations=*");
        let options = {
            headers: headers
        }
        return this.http.patch<T>(this.getContext().getClientUrl() + this.apiUrl + entityType + "(" + id + ")", entity, options).map(response => response);
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
        return this.http.put<T>(this.getContext().getClientUrl() + this.apiUrl + entityType + "(" + id + ")/" + field, v, options).map(response => response);
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

    private resolveQueryResult<T>(response: any, top: number, pages: string[], pageIndex: number): XrmQueryResult<T> {
        let me = this;
        let result = {
            context: response["@odata.context"],
            count: response["@odata.count"],
            value: response["value"] as T[],
            pages: pages,
            prev: null,
            next: null,
            pageIndex: pageIndex
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
                next: (): Observable<XrmQueryResult<T>> => {
                    let headers = new HttpHeaders({ 'Accept': 'application/json' });
                    headers = headers.append("OData-MaxVersion", "4.0");
                    headers = headers.append("OData-Version", "4.0");
                    headers = headers.append("Content-Type", "application/json; charset=utf-8");
                    if (top > 0) {
                        headers = headers.append("Prefer", "odata.include-annotations=\"*\",odata.maxpagesize=" + top.toString());
                    } else {
                        headers = headers.append("Prefer", "odata.include-annotations=\"*\"");
                    }

                    let options = {
                        headers: headers
                    }
                    return me.http.get(nextLink, options).map(r => {
                        pages.push(nextLink);
                        return me.resolveQueryResult<T>(r, top, pages, pageIndex + 1);
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
                if (top > 0) {
                    headers = headers.append("Prefer", "odata.include-annotations=\"*\",odata.maxpagesize=" + top.toString());
                } else {
                    headers = headers.append("Prefer", "odata.include-annotations=\"*\"");
                }

                let options = {
                    headers: headers
                }

                let lastPage = result.pages[result.pageIndex - 1];
                return me.http.get(lastPage, options).map(r => {
                    result.pages.splice(result.pages.length - 1, 1);
                    return me.resolveQueryResult<T>(r, top, result.pages, result.pageIndex -1);
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
