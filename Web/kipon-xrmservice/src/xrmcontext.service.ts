import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { XrmService, XrmContext, XrmEntityKey, XrmQueryResult } from './xrm.service';

export class Entity {
    _pluralName: string;
    _keyName: string;
    _updateable: boolean = false;
    id: string;
    constructor(pluralName: string, keyName: string);
    constructor(pluralName: string, keyName: string, updateable: boolean);
    constructor(pluralName: string, keyName: string, updateable: boolean = false) {
        this._pluralName = pluralName;
        this._keyName = keyName;
        this._updateable = updateable;
    }
}

export class EntityReference {

    constructor();
    constructor(id: string);
    constructor(id: string = null) {
        this.id = id;
    }

    id: string;
    name: string;
    logicalname: string;
    associatednavigationproperty: string;

    clone(): EntityReference {
        let result = new EntityReference();
        result.id = this.id;
        result.name = this.name;
        result.logicalname = this.name;
        result.associatednavigationproperty = this.associatednavigationproperty;
        return result;
    }

    equals(ref: EntityReference): boolean {
        return this.id == ref.id && this.logicalname == ref.logicalname;
    }
}

export enum Operator {
    And,
    Or
}

export enum Comparator {
    Equals,
    NotEquals
}

export class ColumnBuilder {
    columns: string = null;
    hasEntityReference: boolean = false;
}

export class Filter {
    field: string;
    operator: Comparator;
    value: any;

    toQueryString(): string {
        let result = '';

        if (this.value instanceof EntityReference) {
            result = '_' + this.field + '_value';
        } else {
            result = this.field;
        }

        switch (this.operator) {
            case Comparator.Equals: {
                result += ' eq '; break;
            }
            case Comparator.NotEquals: {
                result += ' ne '; break;
            }
        }

        if (this.value instanceof EntityReference) {
            result += this.value.id;
        } else {
            result += "'" + this.value + "'";
        }
        return result;
    }
}

export class Condition {
    operator: Operator = Operator.And;
    filter: Filter[];
    children: Condition[];
    parent: Condition;

    constructor();
    constructor(operator: Operator);
    constructor(operator: Operator = Operator.And) {
        this.operator = operator;
        this.filter = [];
        this.children = [];
    }

    where(field: string, opr: Comparator);
    where(field: string, opr: Comparator, value: any);
    where(field: string, opr: Comparator, value: any = null): Condition {
        let f = new Filter();
        f.field = field;
        f.value = value;
        f.operator = opr;
        this.filter.push(f);
        return this;
    }

    group(opr: Operator): Condition {
        let result: Condition = new Condition(opr);
        result.parent = this;
        this.children.push(result);
        return result;
    }

    toQueryString(): string {
        let me = this;
        let result = '';
        let opr = '';
        if (this.filter != null && this.filter.length > 0) {
            this.filter.forEach(r => {
                result += opr + r.toQueryString();
                if (me.operator == Operator.And) {
                    opr = ' and ';
                } else {
                    opr = ' or ';
                }

            });
        }

        if (this.children != null && this.children.length > 0) {
            this.children.forEach(c => {
                result += opr + "(" + c.toQueryString() + ")";
                if (me.operator == Operator.And) {
                    opr = ' and ';
                } else {
                    opr = ' or ';
                }
            });
        }
        return result;
    }
}

@Injectable()
export class XrmContextService {
    context: any = {};
    cm: any = {};

    constructor(private http: HttpClient, private xrmService: XrmService) { }

    setVersion(v: string) {
        this.xrmService.setVersion(v);
    }

    getContext(): XrmContext {
        return this.xrmService.getContext();
    }

    getCurrentKey(): Observable<XrmEntityKey> {
        return this.xrmService.getCurrenKey();
    }

    get<T extends Entity>(prototype: T, id: string): Observable<T> {
        let me = this;
        let columnDef = this.columnBuilder(prototype);

        return this.xrmService.get<T>(prototype._pluralName, id, columnDef.columns).map(r => {
            return me.resolve<T>(prototype, r, r._updateable);
        });
    }

    query<T extends Entity>(prototype: T, condition: Condition): Observable<XrmQueryResult<T>>;
    query<T extends Entity>(prototype: T, condition: Condition, orderBy: string): Observable<XrmQueryResult<T>>;
    query<T extends Entity>(prototype: T, condition: Condition, orderBy: string, top: number): Observable<XrmQueryResult<T>>;
    query<T extends Entity>(prototype: T, condition: Condition, orderBy: string, top: number, count: boolean): Observable<XrmQueryResult<T>>;
    query<T extends Entity>(prototype: T, condition: Condition, orderBy: string = null, top: number = 0, count: boolean = false): Observable<XrmQueryResult<T>> {
        let me = this;
        let fields = this.columnBuilder(prototype).columns;
        let filter = condition.toQueryString();

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

        let url = this.getContext().getClientUrl() + this.xrmService.apiUrl + prototype._pluralName;
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
            let result = me.resolveQueryResult<T>(prototype, response, top, [url], 0);
            return result;
        });
    }

    private resolveQueryResult<T extends Entity>(prototype:T, response: any, top: number, pages: string[], pageIndex: number): XrmQueryResult<T> {
        let me = this;
        let result = {
            context: response["@odata.context"],
            count: response["@odata.count"],
            value: [],
            pages: pages,
            pageIndex: pageIndex,
            top: top,
            nextLink: null,
            prev: null,
            next: null
        }

        let vals = response["value"] as T[];
        vals.forEach(r => {
            result.value.push(me.resolve(prototype, r, prototype._updateable));
        });

        let nextLink = response["@odata.nextLink"] as string;

        if (nextLink != null && nextLink != '') {
            let start = nextLink.indexOf('/api');
            nextLink = me.getContext().getClientUrl() + nextLink.substring(start);
            result = {
                context: result.context,
                count: result.count,
                value: result.value,
                pages: pages,
                pageIndex: pageIndex,
                top: top,
                nextLink: nextLink,
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
                        let pr = me.resolveQueryResult<T>(prototype, r, top, pages, pageIndex + 1);
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
                    let pr = me.resolveQueryResult<T>(prototype, r, top, result.pages, result.pageIndex - 1);
                    return pr;
                })
            }
        }
        return result;
    }

    private resolve<T extends Entity>(prototype: T, instance: any, updateable: boolean): T {
        let key = prototype._pluralName + ':' + instance[prototype._keyName];
        let result = instance;
        let change = null;

        if (this.context.hasOwnProperty(key)) {
            result = this.context[key];
        } else {
            this.context[key] = result;
            result["id"] = instance[prototype._keyName];
            result["_pluralName"] = prototype._pluralName;
            result["_keyName"] = prototype._keyName;
            delete result[prototype._keyName];
        }

        if (updateable) {
            change = {};
            this.cm[key] = change;
        }

        for (let prop in prototype) {
            if (this.ignoreColumn(prop)) continue;

            if (prototype.hasOwnProperty(prop) && typeof prototype[prop] != 'function') {
                if (prototype[prop] instanceof EntityReference) {
                    let ref = new EntityReference();
                    let id = instance["_" + prop + "_value"];
                    if (id != null && id != 'undefined') {
                        ref.id = id;
                        delete result["_" + prop + "_value"];

                        ref.logicalname = instance["_" + prop + "_value@Microsoft.Dynamics.CRM.lookuplogicalname"];
                        delete instance["_" + prop + "_value@Microsoft.Dynamics.CRM.lookuplogicalname"];

                        ref.name = instance["_" + prop + "_value@OData.Community.Display.V1.FormattedValue"];
                        delete instance["_" + prop + "_value@OData.Community.Display.V1.FormattedValue"];

                        ref.associatednavigationproperty = instance["_" + prop + "_value@Microsoft.Dynamics.CRM.associatednavigationproperty"];
                        delete instance["_" + prop + "_value@Microsoft.Dynamics.CRM.associatednavigationproperty"];
                    }
                    result[prop] = ref;
                    if (change != null) {
                        change[prop] = ref.clone();
                    }
                } else {
                    result[prop] = instance[prop];
                    if (change != null) {
                        change[prop] = instance[prop];
                    }
                }
            }

            if (typeof prototype[prop] === 'function') {
                result[prop] = prototype[prop];
            }
        }

        if (result['onFetch'] !== 'undefined' && result["onFetch"] != null  && typeof result["onFetch"] === 'function') {
            result['onFetch']();
        }
        return result as T;
    }


    private columnBuilder(entity: Entity): ColumnBuilder {
        let hasEntityReference: boolean = false;
        let columns: string = entity._keyName;
        for (var prop in entity) {
            if (prop == entity._keyName) continue;
            if (this.ignoreColumn(prop)) continue;

            if (entity.hasOwnProperty(prop) && typeof (entity[prop] != 'function')) {
                if (entity[prop] instanceof EntityReference) {
                    columns += "," + "_" + prop + "_value";
                    hasEntityReference = true;
                } else {
                    columns += "," + prop;
                }
            }
        }
        let result = new ColumnBuilder();
        result.hasEntityReference = hasEntityReference;
        result.columns = columns;
        return result;
    }

    private ignoreColumn(prop: string): boolean {
        if (prop == "_pluralName" || prop == "_keyName" || prop == "id" || prop == '_updateable') {
            return true;
        }
        return false;
    }
}