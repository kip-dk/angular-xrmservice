import { Injectable, Injector } from '@angular/core';

import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'

import { XrmConfigService } from './xrmconfig.service';

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
    additional: Expand[];

    toExpandString(): string {
      let _ex = this.name;
      if (this.select != null || this.filter != null) {
        _ex += '(';
      }
      let semi = '';
      if (this.select != null) {
        _ex += '$select=' + this.select;
        semi = ';'
      }

      if (this.filter != null) {
        _ex += semi + '$filter=' + this.filter;
      }

      if (this.select != null || this.filter != null) {
        _ex += ')';
      }
      return _ex;
    }
}



@Injectable()
export class XrmService {
    private defaultApiUrl: string = "/api/data/v8.2/";
    private contextFallback: XrmContext = null;
    apiUrl: string = '/api/data/v8.2/';
    apiVersion: string = 'v8.2';
    debug: boolean = false;
    token: string = null;
    private loginObserver: any;

    constructor(private http: HttpClient, private injector: Injector) {
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
                x.getVersion = (): string => "8.2.0.0"
            }
            x.$devClientUrl = () => { return this.getContext().getClientUrl() + this.apiUrl };
            this.contextFallback = x;
            this.initializeVersion(this.contextFallback.getVersion());
            return x;
        }

        if (window['Xrm'] != null) {
            var x = window["Xrm"]["Page"]["context"] as XrmContext;
            if (x != null) {
                if (x.getVersion == undefined) {
                    x.getVersion = (): string => "8.2.0.0"
                }
                x.$devClientUrl = () => { return this.getContext().getClientUrl() + this.apiUrl };
                this.contextFallback = x;
                this.initializeVersion(this.contextFallback.getVersion());
                return x;
            }
        }

        if (window.parent != null && window.parent['Xrm'] != null) {
            var x = window.parent["Xrm"]["Page"]["context"] as XrmContext;
            if (x != null) {
                if (x.getVersion == undefined) {
                    x.getVersion = (): string => "8.2.0.0"
                }
                x.$devClientUrl = () => { return this.getContext().getClientUrl() + this.apiUrl };
                this.contextFallback = x;
                this.initializeVersion(this.contextFallback.getVersion());
                return x;
            }
        }

        let baseUrl = "http://localhost:4200";
        let version = 'v8.2';

        try {
            var configService = this.injector.get(XrmConfigService) as XrmConfigService;
            if (configService != null) {
                let config = configService.getConfig();
                if (config != null && config.endpoints != null && config.endpoints.orgUri != null && config.endpoints.orgUri != '') {
                  baseUrl = config.endpoints.orgUri;
                }
                if (config != null && config.version != null && config.version != '') {
                  version = config.version;
                }
            }
        } catch (err) {
            // no worry, XrmConfigService is optional
        }


        this.contextFallback = {
            getClientUrl(): string {
              return baseUrl;
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
              return version.substring(1) + '.0.0';
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

        this.http.get(baseUrl + "/api/data/" + version + "/WhoAmI()").subscribe(r => {
            this.log(r);
            let url = r['@odata.context'] as string;

            let firstpart = url.split('/api/data/')[0];
            let version = url.split('/api/data/')[1].split('/')[0];

            this.contextFallback["$clienturl"] = firstpart + '/api/data/' + version + '/';

            this.contextFallback["userid"] = r["UserId"];
            this.contextFallback["username"] = "Dev. fallback from whoami";
            this.initializeVersion(this.contextFallback.getVersion());
        });

        return this.contextFallback;
  }

  getCurrentUserId(): Observable<string> {
    var ctx = this.getContext();
    if (ctx.getUserId() == null || ctx.getUserId() == '') {

      let baseUrl = "http://localhost:4200";
      let version = 'v8.2';
      return this.http.get(baseUrl + "/api/data/" + version + "/WhoAmI()").pipe(map(r => { return r["UserId"] } ));
    } else {
      return new Observable<string>(obs => obs.next(ctx.getUserId()));
    }
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
            result.id = this.toGuid(result.id);
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

                result.id = this.toGuid(result.id);
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
            result.id = this.toGuid(result.id);
            return new Observable<XrmEntityKey>(obs => obs.next(result));
        }
    }
    get<T>(entityTypes: string, id: string, fields: string): Observable<T>;
    get<T>(entityTypes: string, id: string, fields: string, expand: Expand): Observable<T>;
    get<T>(entityTypes: string, id: string, fields: string, expand: Expand = null): Observable<T> {
      let headers = new HttpHeaders({ 'Accept': 'application/json' });
        if (this.token != null) {
          headers = headers.append("Authorization", "Bearer " + this.token);
        }
        headers = headers.append("OData-MaxVersion", "4.0");
        headers = headers.append("OData-Version", "4.0");
        headers = headers.append("Content-Type", "application/json; charset=utf-8");
        headers = headers.append("Prefer", "odata.include-annotations=*");
        headers = headers.append("Cache-Control", "no-cache");

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
        this.log(url);

        return this.http.get<T>(url, options);
    }

    query<T>(entityTypes: string, fields: string, filter: string): Observable<XrmQueryResult<T>>;
    query<T>(entityTypes: string, fields: string, filter: string, orderBy: string): Observable<XrmQueryResult<T>>;
    query<T>(entityTypes: string, fields: string, filter: string, orderBy: string, top: number): Observable<XrmQueryResult<T>>;
    query<T>(entityTypes: string, fields: string, filter: string, orderBy: string, top: number, count: boolean): Observable<XrmQueryResult<T>>;
    query<T>(entityTypes: string, fields: string, filter: string, orderBy: string = null, top: number = 0, count: boolean = false): Observable<XrmQueryResult<T>> {
        let me = this;
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        if (this.token != null) {
          headers = headers.append("Authorization", "Bearer " + this.token);
        }
        headers = headers.append("OData-MaxVersion", "4.0");
        headers = headers.append("OData-Version", "4.0");
        headers = headers.append("Content-Type", "application/json; charset=utf-8");
        headers = headers.append("Prefer", "odata.include-annotations=\"*\"");
        if (top > 0) {
            headers = headers.append("Prefer", "odata.maxpagesize=" + top.toString());
        } else {
        }
        headers = headers.append("Cache-Control", "no-cache");

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

        return this.http.get(url, options).pipe(map(response => {
            let result = me.resolveQueryResult<T>(response, top, [url], 0);
            return result;
        }));
    }

    create<T>(entityType: string, entity: T): Observable<T> {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        if (this.token != null) {
          headers = headers.append("Authorization", "Bearer " + this.token);
        }
        headers = headers.append("OData-MaxVersion", "4.0");
        headers = headers.append("OData-Version", "4.0");
        headers = headers.append("Content-Type", "application/json; charset=utf-8");
        headers = headers.append("Prefer", "odata.include-annotations=*");

        if (!this.getContext().getVersion().startsWith("8.2")) {
            headers = headers.append("Prefer", "return=representation");
        }

        let options = {
            headers: headers,
        }

        return this.http.post(this.getContext().getClientUrl() + this.apiUrl + entityType, entity, { headers: headers, observe: "response" }).pipe(map(
            (res: HttpResponse<any>) => {
                if (res.body == null) {
                    let entityId = res.headers.get('OData-EntityId') as string;
                    let result = { id: entityId.split('(')[1].replace(')',''), $keyonly: true };
                    return result;
                } else {
                    return res.body;
                }
            }
        ));
    }

    update<T>(entityType: string, entity: T, id: string): Observable<T>;
    update<T>(entityType: string, entity: T, id: string, fields: string): Observable<T>;
    update<T>(entityType: string, entity: T, id: string, fields: string = null): Observable<T> {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        if (this.token != null) {
          headers = headers.append("Authorization", "Bearer " + this.token);
        }
        headers = headers.append("OData-MaxVersion", "4.0");
        headers = headers.append("OData-Version", "4.0");
        headers = headers.append("Content-Type", "application/json; charset=utf-8");
        headers = headers.append("Prefer", "odata.include-annotations=*");

        if (fields != null && !this.getContext().getVersion().startsWith("8.2")) {
            headers = headers.append("Prefer", "return=representation");
        } 

        let options = {
            headers: headers
        }

        let _f = '';
        if (fields != null) {
            _f = '?$select=' + fields;
        }
        return this.http.patch<T>(this.getContext().getClientUrl() + this.apiUrl + entityType + "(" + id + ")" + _f, entity, options).pipe(map(response => {
            if (this.getContext().getVersion().startsWith("8.2")) {
                return entity;
            }
            return response;
        }));
    }

    put(entityType: string, id: string, field: string, value: any): Observable<null>;
    put(entityType: string, id: string, field: string, value: any, propertyValueAs: string): Observable<null>;
    put(entityType: string, id: string, field: string, value: any, propertyValueAs: string = null): Observable<null> {
        if (propertyValueAs == null) propertyValueAs = 'value';

        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        if (this.token != null) {
          headers = headers.append("Authorization", "Bearer " + this.token);
        }
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
        this.log(v);


        let url = this.getContext().getClientUrl() + this.apiUrl + entityType + "(" + id + ")/" + field;
        this.log(url);

        if (v[propertyValueAs] != null) {
            return this.http.put(url, v, options).pipe(map(response => null));
        } else {
            return this.http.delete(url, options).pipe(map(response => null));
        }
    }

    delete(entityType: string, id: string): Observable<null> {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        if (this.token != null) {
          headers = headers.append("Authorization", "Bearer " + this.token);
        }
        headers = headers.append("OData-MaxVersion", "4.0");
        headers = headers.append("OData-Version", "4.0");
        headers = headers.append("Content-Type", "application/json; charset=utf-8");
        headers = headers.append("Prefer", "odata.include-annotations=*");
        let options = {
            headers: headers
        }

        let url = this.getContext().getClientUrl() + this.apiUrl + entityType + "(" + id + ")";
        this.log(url);
        return this.http.delete(url).pipe(map(response => null));
    }

    getParameter(param: string): string {
      return this.getQueryStringParameters()[param];
    }

    associate(fromType: string, fromId: string, toType: string, toId: string, refname: string): Observable<null> {
      let headers = new HttpHeaders({ 'Accept': 'application/json' });
      if (this.token != null) {
        headers = headers.append("Authorization", "Bearer " + this.token);
      }
      headers = headers.append("OData-MaxVersion", "4.0");
      headers = headers.append("OData-Version", "4.0");
      headers = headers.append("Content-Type", "application/json; charset=utf-8");
      headers = headers.append("Prefer", "odata.include-annotations=*");
      let options = {
        headers: headers
      }

      let url = this.getContext().getClientUrl() + this.apiUrl + fromType + "(" + this.toGuid(fromId) + ")/" + refname + "/$ref";

      let data = {
        "@odata.id": this.getContext().$devClientUrl() + toType + "(" + this.toGuid(toId) + ")"
      }

      if (this.debug) {
        this.log(url);
        this.log(data);
      }

      return this.http.post(url, data, options).pipe(map(response => null));
    }

    disassociate(fromType: string, fromId: string, toType: string, toId: string, refname: string): Observable<null> {
      let headers = new HttpHeaders({ 'Accept': 'application/json' });
      if (this.token != null) {
        headers = headers.append("Authorization", "Bearer " + this.token);
      }
      headers = headers.append("OData-MaxVersion", "4.0");
      headers = headers.append("OData-Version", "4.0");
      let options = {
        headers: headers
      }

      let url = this.getContext().getClientUrl() + this.apiUrl + fromType + "(" + this.toGuid(fromId) + ")/" + refname + "/$ref?$id=" + this.getContext().$devClientUrl() + toType + "(" + this.toGuid(toId) + ")";
      this.log(url);

      return this.http.delete(url, options).pipe(map(response => {
        this.log(response);
        return null;
      }));
    }

    action(name: string, data: any): Observable<any>;
    action(name: string, data: any, boundType: string, boundId: string): Observable<any>;
    action(name: string, data: any, boundType: string = null, boundId: string = null): Observable<any> {
      let headers = new HttpHeaders({ 'Accept': 'application/json' });
      if (this.token != null) {
        headers = headers.append("Authorization", "Bearer " + this.token);
      }
      headers = headers.append("OData-MaxVersion", "4.0");
      headers = headers.append("OData-Version", "4.0");
      let options = {
        headers: headers
      }

      let url = this.getContext().getClientUrl() + this.apiUrl + name;
      if (boundType != null) {
        url = this.getContext().getClientUrl() + this.apiUrl + boundType + "(" + this.toGuid(boundId) + ")/" + name;
      }
      this.log(url);

      return this.http.post(url, data, options).pipe(map(response => {
        this.log(response);
        return response;
      }));
    }

    log(message:any): void {
      if (this.debug) {
        if (typeof message == 'string') {
          console.dir(message);
        } else {
          console.log(message);
        }
      } 
    }

    private initializeVersion(_v: string): void {
      if (_v == null) { _v = '8.2.0.0'; }
      let v = _v.split('.');
      this.setVersion(v[0] + "." + v[1]);
      this.apiVersion = 'v' + v[0] + '.' + v[1];
    }

    private expandString(expand: Expand, sep: string): string {
        if (expand == null || expand.name == null || expand.name == '') return '';

        let _ex = sep + '$expand=' + expand.toExpandString();

        if (expand.additional != null && expand.additional.length > 0) {
          expand.additional.forEach(ad => {
            _ex += "," + ad.toExpandString();
          });
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
                    if (this.token != null) {
                      headers = headers.append("Authorization", "Bearer " + this.token);
                    }
                    headers = headers.append("OData-MaxVersion", "4.0");
                    headers = headers.append("OData-Version", "4.0");
                    headers = headers.append("Content-Type", "application/json; charset=utf-8");
                    headers = headers.append("Prefer", "odata.include-annotations=\"*\"");
                    if (top > 0) {
                        headers = headers.append("Prefer", "odata.maxpagesize=" + top.toString());
                    } 
                    headers = headers.append("Cache-Control", "no-cache");

                    let options = {
                        headers: headers
                    }
                    return me.http.get(nextLink, options).pipe(map(r => {
                      pages.push(nextLink);
                      let pr = me.resolveQueryResult<T>(r, top, pages, pageIndex + 1);
                      return pr;
                    }));
                }
            }
        }

        if (result.pageIndex >= 1) {
            result.prev = (): Observable<XrmQueryResult<T>> => {
                let headers = new HttpHeaders({ 'Accept': 'application/json' });
                if (this.token != null) {
                  headers = headers.append("Authorization", "Bearer " + this.token);
                }
                headers = headers.append("OData-MaxVersion", "4.0");
                headers = headers.append("OData-Version", "4.0");
                headers = headers.append("Content-Type", "application/json; charset=utf-8");
                headers = headers.append("Prefer", "odata.include-annotations=\"*\"");
                if (top > 0) {
                    headers = headers.append("Prefer", "odata.maxpagesize=" + top.toString());
                } else {
                }
                headers = headers.append("Cache-Control", "no-cache");

                let options = {
                    headers: headers
                }

                let lastPage = result.pages[result.pageIndex - 1];
                return me.http.get(lastPage, options).pipe(map(r => {
                  result.pages.splice(result.pages.length - 1, 1);
                  let pr = me.resolveQueryResult<T>(r, top, result.pages, result.pageIndex - 1);
                  return pr;
                }));
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

    private toGuid(v: string): string {
        // 5C48BB2A-BFC0-4E56-A262-8494E0F6A8FD
        if (v == null || v == '') {
            return v;
        }

        v = decodeURIComponent(v).replace('{', '').replace('}', '');

        if (v.indexOf('-') >= 0) {
            return v;
        }
        return v.substr(0, 8) + '-' + v.substr(8, 4) + '-' + v.substr(12, 4) + '-' + v.substr(16, 4) + '-' + v.substr(20); 
    }
}
