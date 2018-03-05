import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

export interface XrmContext {
    getClientUrl(): string;
    getQueryStringParameters(): any;
    getVersion(): string;
    getUserName(): string;
    getUserId(): string;
    $devClientUrl(): string;
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
    private defaultApiUrl: string = "/api/data/v8.2/";
    private contextFallback: XrmContext = null;
    apiUrl: string = '/api/data/v8.2/';
    apiVersion: string = 'v8.2';
    debug: boolean = false;

    constructor(private http: HttpClient) {
        let v = this.getContext().getVersion().split('.');
        this.setVersion(v[0] + "." + v[1]);
        this.apiVersion = 'v' + v[0] + '.' + v[1];
    }

    setVersion(v: string): void {
        this.apiUrl = this.defaultApiUrl.replace("8.2", v);
    }

    getContext(): XrmContext {
        if (this.contextFallback != null) {
            return this.contextFallback;
        }

        if (typeof window['GetGlobalContext'] != "undefined") {
            let x = window['GetGlobalContext']();
            if (x.getVersion == undefined) {
                x.getVersion = (): string => "8.0.0.0"
            }
            x.$devClientUrl = () => { return this.getContext().getClientUrl() + this.apiUrl };
            return x;
        }

        if (window['Xrm'] != null) {
            var x = window["Xrm"]["Page"]["context"] as XrmContext;
            if (x != null) {
                if (x.getVersion == undefined) {
                    x.getVersion = (): string => "8.0.0.0"
                }
                x.$devClientUrl = () => { return this.getContext().getClientUrl() + this.apiUrl };
                return x;
            }
        }

        if (window.parent != null && window.parent['Xrm'] != null) {
            var x = window.parent["Xrm"]["Page"]["context"] as XrmContext;
            if (x != null) {
                if (x.getVersion == undefined) {
                    x.getVersion = (): string => "8.0.0.0"
                }
                x.$devClientUrl = () => { return this.getContext().getClientUrl() + this.apiUrl };
                return x;
            }
        }

        this.contextFallback = {
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
            },
            getUserId(): string {
                return this["userid"];
            },
            getUserName(): string {
                return this["username"];
            },
            $devClientUrl(): string {
                return this['$clienturl'];
            }
        };

        this.http.get("http://localhost:4200/api/data/v8.0/WhoAmI()").map(response => response).subscribe(r => {
            if (this.debug) {
                console.log(r);
            }

            let url = r['@odata.context'] as string;

            let firstpart = url.split('/api/data/')[0];
            let version = url.split('/api/data/')[1].split('/')[0];

            this.contextFallback["$clienturl"] = firstpart + '/api/data/' + version + '/';

            this.contextFallback["userid"] = r["UserId"];
            this.contextFallback["username"] = "Dev. fallback from whoami";
        });

        return this.contextFallback;
    }

    getCurrenKey(): Observable<XrmEntityKey> {
        let params = this.getContext().getQueryStringParameters();
        let result = new XrmEntityKey();
        result.id = params["id"];
        result.entityType = params["typename"];

        if (result.id != null) {
            result.id = decodeURIComponent(result.id).replace('{', '').replace('}', '').toLowerCase();
            if (result.entityType === 'undefined' ||result.entityType == null || result.entityType == '') {
                result.entityType = this.getQueryStringParameters()["typename"];
            }
            return new Observable<XrmEntityKey>(obs => obs.next(result));
        }

        if (window.parent && window.parent["Xrm"] &&
            window.parent["Xrm"]["Page"] &&
            window.parent["Xrm"]["Page"]["ui"] &&
            window.parent["Xrm"]["Page"]["ui"]["getFormType"] &&
            window.parent["Xrm"]["Page"]["ui"]["getFormType"] != null &&
            window.parent["Xrm"]["Page"]["ui"]["getFormType"]() == 2) {
            result.id = window.parent["Xrm"]["Page"]["data"]["entity"]["getId"]();
            result.entityType = window.parent["Xrm"]["Page"]["data"]["entity"]["getEntityName"]();

            if (result.id != null) {
                result.id = decodeURIComponent(result.id).replace('{', '').replace('}', '').toLowerCase();
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
                        result.id = decodeURIComponent(result.id).replace('{', '').replace('}', '').toLowerCase();
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

        let url = this.getContext().getClientUrl() + this.apiUrl + entityTypes + "(" + _id + ")" + addFields + _ex;
        if (this.debug) {
            console.log(url);
        }

        return this.http.get<T>(url, options).map(response => response);
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

        if (!this.getContext().getVersion().startsWith("8.0")) {
            headers = headers.append("Prefer", "return=representation");
        }

        let options = {
            headers: headers,
        }

        return this.http.post(this.getContext().getClientUrl() + this.apiUrl + entityType, entity, { headers: headers, observe: "response" }).map(
            (res: HttpResponse<any>) => {
                if (res.body == null) {
                    let entityId = res.headers.get('OData-EntityId') as string;
                    let result = { id: entityId.split('(')[1].replace(')',''), $keyonly: true };
                    return result;
                } else {
                    return res.body;
                }
            }
        );
    }

    update<T>(entityType: string, entity: T, id: string): Observable<T>;
    update<T>(entityType: string, entity: T, id: string, fields: string): Observable<T>;
    update<T>(entityType: string, entity: T, id: string, fields: string = null): Observable<T> {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers = headers.append("OData-MaxVersion", "4.0");
        headers = headers.append("OData-Version", "4.0");
        headers = headers.append("Content-Type", "application/json; charset=utf-8");
        headers = headers.append("Prefer", "odata.include-annotations=*");

        if (fields != null && !this.getContext().getVersion().startsWith("8.0")) {
            headers = headers.append("Prefer", "return=representation");
        } 

        let options = {
            headers: headers
        }

        let _f = '';
        if (fields != null) {
            _f = '?$select=' + fields;
        }
        return this.http.patch<T>(this.getContext().getClientUrl() + this.apiUrl + entityType + "(" + id + ")" + _f, entity, options).map(response => {
            if (this.getContext().getVersion().startsWith("8.0")) {
                return entity;
            }
            return response;
        });
    }

    put(entityType: string, id: string, field: string, value: any): Observable<null>;
    put(entityType: string, id: string, field: string, value: any, propertyValueAs: string): Observable<null>;
    put(entityType: string, id: string, field: string, value: any, propertyValueAs: string = null): Observable<null> {
        if (propertyValueAs == null) propertyValueAs = 'value';

        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers = headers.append("OData-MaxVersion", "4.0");
        headers = headers.append("OData-Version", "4.0");
        headers = headers.append("Content-Type", "application/json; charset=utf-8");
        headers = headers.append("Prefer", "odata.include-annotations=*");
        let options = {
            headers: headers
        }
        let v = {
        };

        v[propertyValueAs] = value;

        if (this.debug) { console.log(v); }

        let url = this.getContext().getClientUrl() + this.apiUrl + entityType + "(" + id + ")/" + field;
        if (this.debug)  console.log(url);

        if (v[propertyValueAs] != null) {
            return this.http.put(url, v, options).map(response => null);
        } else {
            return this.http.delete(url, options).map(response => null);
        }
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

        let url = this.getContext().getClientUrl() + this.apiUrl + entityType + "(" + id + ")";
        if (this.debug) {
            console.log(url);
        }
        return this.http.delete(url).map(response => null);
    }

    getParameter(param: string): string {
      return this.getQueryStringParameters()[param];
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
