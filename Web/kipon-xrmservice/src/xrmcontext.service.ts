import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { XrmService, XrmContext, XrmEntityKey, XrmQueryResult, Expand } from './xrm.service';

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
    pluralName: string;

    meta(pluralName: string, associatednavigationproperty: string): EntityReference {
        this.pluralName = pluralName;
        this.associatednavigationproperty = associatednavigationproperty;
        return this;
    }

    clone(): EntityReference {
        let result = new EntityReference();
        result.id = this.id;
        result.name = this.name;
        result.logicalname = this.name;
        result.associatednavigationproperty = this.associatednavigationproperty;
        return result;
    }

    associatednavigationpropertyname(): string {
        if (this.associatednavigationproperty == null || this.associatednavigationproperty == '') {
            throw 'navigation property has not been set for this EntityReference instance';
        }

        if (this.associatednavigationproperty.endsWith('@odata.bind')) {
            return this.associatednavigationproperty;
        }
        return this.associatednavigationproperty + '@odata.bind';
    }

    equals(ref: EntityReference): boolean {
        return this.id == ref.id && this.logicalname == ref.logicalname;
    }

    static same(ref1: EntityReference, ref2: EntityReference): boolean {
        if (ref1 == null && ref2 == null) {
            return true;
        }

        let id1: string = null;
        let id2: string = null;
        if (ref1 != null) id1 = ref1.id;
        if (ref2 != null) id2 = ref2.id;
        return id1 == id2;
     }
}

export class OptionSetValue {
    constructor();
    constructor(value: number);
    constructor(value: number, name: string);
    constructor(value: number = null, name: string = null) {
        this.value = value;
        this.name = name;
    }

    value: number;
    name: string;

    equals(o: OptionSetValue): boolean {
        if (this.value == null && (o == null || o.value == null)) return true;
        return this.value == o.value;
    }

    clone(): OptionSetValue {
        let r = new OptionSetValue();
        r.name = this.name;
        r.value = this.value;
        return r;
    }

    static same(o1: OptionSetValue, o2: OptionSetValue): boolean {
        if (o1 == null && o2 == null) return true;
        let v1: number = null;
        let v2: number = null;
        if (o1 != null) v1 = o1.value;
        if (o2 != null) v2 = o2.value;
        return v1 == v2;
    }
}


export enum Operator {
    And,
    Or
}

export enum Comparator {
    Equals,
    NotEquals,
    Contains,
    NotContains,
    DoesNotContainsData,
    ContainsData,
    StartsWith,
    NotStartsWith,
    EndsWith,
    NotEndsWith
}

export class ColumnBuilder {
    columns: string = null;
    hasEntityReference: boolean = false;
}

export class Filter {
    field: string;
    operator: Comparator;
    value: any;

    toQueryString(prototype: Entity): string {
        let result = '';
        let _f = this.field;
        let _v = "'" + this.value + "'";

        if (typeof this.value == 'number') {
            _v = this.value.toString();
        }

        if (typeof this.value == 'boolean') {
            _v = this.value.valueOf() ? 'true' : 'false';
        }

        if (prototype[this.field] instanceof OptionSetValue)
        {
            if (this.value != null && this.value.hasOwnProperty('value')) {
                _v = this.value.value;
            }
        }

        if (prototype[this.field] instanceof EntityReference) {
            _f = "_" + this.field + "_value";
            if (typeof this.value == 'string') {
                _v = this.value;
            } else {
                _v = this.value.id;
            }
        }

       switch (this.operator) {
           case Comparator.Equals: {
               return _f + ' eq ' + _v;
            }
           case Comparator.NotEquals: {
               return _f + ' ne ' + _v;
            }
            case Comparator.Contains: {
                return "contains(" + _f + ","+ _v + ")"; 
           }
            case Comparator.NotContains: {
               return "not contains(" + _f + "," + _v + ")"; 
            }
            case Comparator.StartsWith: {
               return "startswith(" + _f + "," + _v + ")"; 
            }
            case Comparator.NotStartsWith: {
               return "not startswith(" + _f + "," + _v + ")"; 
            }
            case Comparator.EndsWith: {
               return "endswith(" + _f + "," + _v + ")";
            }
            case Comparator.NotEndsWith: {
               return "not endswith(" + _f + "," + _v + ")";
            }
            case Comparator.ContainsData: {
               return _f + ' ne null';
            }
            case Comparator.DoesNotContainsData: {
                return _f + ' eq null';
            }
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

    isActive(): Condition {
        return this.where("statecode", Comparator.Equals, 0);
    }

    isInactive(): Condition {
        return this.where("statecode", Comparator.Equals, 1);
    }

    toQueryString(prototype: Entity): string {
        if ((this.children == null || this.children.length == 0) && (this.filter == null || this.filter.length == 0)) {
            return null;
        }

        let me = this;
        let result = '';
        let opr = '';
        if (this.filter != null && this.filter.length > 0) {
            this.filter.forEach(r => {
                result += opr + r.toQueryString(prototype);
                if (me.operator == Operator.And) {
                    opr = ' and ';
                } else {
                    opr = ' or ';
                }

            });
        }

        if (this.children != null && this.children.length > 0) {
            this.children.forEach(c => {
                result += opr + "(" + c.toQueryString(prototype) + ")";
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

class ExpandProperty {
    name: string;
    entity: Entity;
    isArray: boolean;
}

@Injectable()
export class XrmContextService {
    private context: any = {};
    private changemanager: any = {};

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

    getServiceUrl(): string {
        return this.getContext().getClientUrl() + this.xrmService.apiUrl;
    }

    get<T extends Entity>(prototype: T, id: string): Observable<T> {
        let me = this;
        let columnDef = this.columnBuilder(prototype);

        let expand: Expand = null;

        let ep = this.getExpandProperty(prototype);
        if (ep != null) {
            expand = this.$expandToExpand(ep);
        }

        return this.xrmService.get<T>(prototype._pluralName, id, columnDef.columns, expand).map(r => {
            return me.resolve<T>(prototype, r, prototype._updateable);
        });
    }

    query<T extends Entity>(prototype: T, condition: Condition): Observable<XrmQueryResult<T>>;
    query<T extends Entity>(prototype: T, condition: Condition, orderBy: string): Observable<XrmQueryResult<T>>;
    query<T extends Entity>(prototype: T, condition: Condition, orderBy: string, top: number): Observable<XrmQueryResult<T>>;
    query<T extends Entity>(prototype: T, condition: Condition, orderBy: string, top: number, count: boolean): Observable<XrmQueryResult<T>>;
    query<T extends Entity>(prototype: T, condition: Condition, orderBy: string = null, top: number = 0, count: boolean = false): Observable<XrmQueryResult<T>> {
        let me = this;
        let fields = this.columnBuilder(prototype).columns;

        let con = condition;
        while (con.parent != null) con = con.parent;

        let filter = con.toQueryString(prototype);

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

        if (this.xrmService.debug) console.log(url);

        return this.http.get(url, options).map(response => {
            let result = me.resolveQueryResult<T>(prototype, response, top, [url], 0);
            return result;
        });
    }

    create<T extends Entity>(prototype: T, instance: T): Observable<T> {
        let newr = {
        };

        for (let prop in prototype) {
            if (prototype.hasOwnProperty(prop) && typeof prototype[prop] !== 'function') {
                if (this.ignoreColumn(prop)) continue;

                let value = instance[prop];
                if (value !== 'undefined' && value !== null) {

                    if (prototype[prop] instanceof EntityReference) {
                        let ref = instance[prop] as EntityReference;
                        if (ref.id != null) {
                            newr[prototype[prop]['associatednavigationpropertyname']()] = '/' + prototype[prop]['pluralName'] + '(' + ref.id + ')';
                        }
                        continue;
                    }

                    if (prototype[prop] instanceof OptionSetValue) {
                        let o = instance[prop] as OptionSetValue;
                        if (o.value != null) {
                            newr[prop.toString()] = o.value; 
                        }
                        continue;
                    }

                    if (prototype[prop] instanceof Date) {
                        let d = value as Date;
                        newr[prop.toString()] = d.toISOString();
                        continue;
                    }

                    newr[prop.toString()] = instance[prop];
                }
            }
        }

        if (this.xrmService.debug) {
            console.log(newr);
        }

        return this.xrmService.create<T>(prototype._pluralName, newr as T).map(response => {
            if (this.xrmService.debug) {
                console.log(response);
            }

            if (response != null) {
                if (response.hasOwnProperty('$keyonly')) {
                    response._pluralName = prototype._pluralName;
                    response._keyName = prototype._keyName;
                    response._updateable = false;

                    let key = response._pluralName + ':' + response.id;
                    for (let prop in prototype) {
                        if (typeof prototype[prop] === 'function') {
                            response[prop] = prototype[prop];
                            continue;
                        }

                        if (prototype.hasOwnProperty(prop)) {
                            if (this.ignoreColumn(prop)) continue;

                            let value = instance[prop];
                            if (value !== 'undefined' && value !== null) {
                                response[prop] = value;
                            }
                        }
                    }
                    this.context[key] = response;
                    return response;
                } else {
                    return this.resolve(prototype, response, true);
                }
            }
            return null;
        });
    }

    update<T extends Entity>(prototype: T, instance: T): Observable<T> {
        let me = this;
        let upd = {
        }

        let key = instance._pluralName + ':' + instance.id;
        let cm = this.changemanager[key];
        if (typeof cm === 'undefined' || cm === null) {
            throw 'the object is not under change control and cannot be updated within this context';
        }

        for (let prop in prototype) {
            if (prototype.hasOwnProperty(prop) && typeof prototype[prop] != 'function') {
                if (this.ignoreColumn(prop)) continue;
                let prevValue = cm[prop];
                let newValue = instance[prop];

                if ((prevValue === 'undefined' || prevValue === null) && (newValue === 'undefined' || newValue === null)) continue;

                if (prototype[prop] instanceof EntityReference) {
                    let r = prototype[prop] as EntityReference;
                    if (!EntityReference.same(prevValue, newValue)) {
                        if (newValue != null && newValue["id"] != null && newValue["id"] != '') {
                            upd[prototype[prop]['associatednavigationpropertyname']()] = '/' + prototype[prop]['pluralName'] + '(' + newValue['id'] + ')';
                        } else {
                            upd[prototype[prop]['associatednavigationpropertyname']()] = null;
                        }
                    }
                    continue;
                }

                if (prototype[prop] instanceof OptionSetValue) {
                    if (!OptionSetValue.same(prevValue, newValue)) {
                        let o = newValue as OptionSetValue;
                        if (o == null || o.value == null) {
                            upd[prop.toString()] = null;
                        } else {
                            upd[prop.toString()] = o.value;
                        }
                    }
                    continue;
                }

                if (prototype[prop] instanceof Date) {
                    if (prevValue != newValue) {
                        if (newValue == null) {
                            upd[prop.toString()] = null;
                        } else {
                            let d = newValue as Date;
                            upd[prop.toString()] = d.toISOString();
                        }
                    }
                    continue;
                }

                if (prevValue != newValue) {
                    upd[prop.toString()] = instance[prop];
                }
            }
        }

        let fields = this.columnBuilder(prototype).columns;

        return this.xrmService.update<T>(prototype._pluralName, upd as T, instance.id, fields).map(response => {
            if (this.getContext().getVersion().startsWith("8.0")) {
                this.updateCM(prototype, instance);
                return instance;
            }
            return me.resolve(prototype, response, true);
        });
    }

    put(prototype: Entity, instance: Entity, field: string): Observable<null> {
        let v = instance[field];
        let t = prototype[field];
        let f = v;
        let done: boolean = false;
        let pv: string = null;

        if (t instanceof OptionSetValue) {
            if (v == null || v['value'] == null) {
                f = null;
            } else {
                f = v.value;
            }
            done = true;
        }

        if (t instanceof EntityReference) {
            pv = "@odata.id";
            field = t.associatednavigationpropertyname().split('@')[0] + "/$ref";
            if (v.id == null || v.id == '') {
                f = null;
            } else {
                f = this.getContext().$devClientUrl() + t.pluralName + "(" + v.id + ")";
            }
        }
        return this.xrmService.put(prototype._pluralName, instance.id, field, f, pv);
    }


    delete<T extends Entity>(t: T): Observable<null> {
        let me = this;
        return this.xrmService.delete(t._pluralName, t.id).map(r => {
            let key = t._pluralName + ":" + t.id;
            if (me.context.hasOwnProperty(key)) {
                delete me.context[key];
            }
            return null;
        });
    }

    log(type: string): void {
        if (type == 'context') {
            console.log(this.context);
            return;
        }

        if (type == 'xrmcontext') {
            console.log(this.getContext());
            return;
        }

        if (type == 'url') {
            console.log(this.getContext().getClientUrl());
        }

        if (type == 'version') {
            console.log(this.getContext().getVersion());
        }

        console.log('xrmContextService supported the current log types: context, xrmcontext, url, version');
    } 

    private $expandToExpand(prop: ExpandProperty): Expand {
        if (prop != null) {
            let result = new Expand();
            result.name = prop.name;
            result.select = this.columnBuilder(prop.entity).columns;
            return result;
        }
        return null;
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
                    let pr = me.resolveQueryResult<T>(prototype, r, top, result.pages, result.pageIndex - 1);
                    return pr;
                })
            }
        }
        return result;
    }

    private resolve<T extends Entity>(prototype: T, instance: any, updateable: boolean): T {
        let me = this;
        let key = prototype._pluralName + ':' + instance[prototype._keyName];
        let result = instance;

        if (this.context.hasOwnProperty(key)) {
            result = this.context[key];
        } else {
            this.context[key] = result;
            result["id"] = instance[prototype._keyName];
            result["_pluralName"] = prototype._pluralName;
            result["_keyName"] = prototype._keyName;
            delete result[prototype._keyName];
        }

        result['_updateable'] = updateable;

        for (let prop in prototype) {
            if (this.ignoreColumn(prop)) continue;

            if (prototype.hasOwnProperty(prop) && typeof prototype[prop] != 'function') {
                let done = false;
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
                    done = true;
                }

                if (!done && prototype[prop] instanceof OptionSetValue) {
                    let opt = new OptionSetValue();
                    opt.value = instance[prop];
                    opt.name = instance[prop + '@OData.Community.Display.V1.FormattedValue'];
                    result[prop] = opt;
                    done = true;
                }

                if (!done && prototype[prop] instanceof Date) {
                    let v = instance[prop];
                    if (v != null && v != '') {
                        result[prop] = new Date(Date.parse(v));
                    } else {
                        result[prop] = null;
                    }

                    done = true;
                }

                if (!done) {
                    result[prop] = instance[prop];
                    done = true;
                }
            }

            if (typeof prototype[prop] === 'function') {
                result[prop] = prototype[prop];
            }
        }

        if (updateable) {
            this.updateCM(prototype, instance);
        }

        let ep = this.getExpandProperty(prototype);
        if (ep != null) {
            if (ep.isArray) {
                let _v = instance[ep.name];
                if (_v != null && Array.isArray(_v)) {
                    let _tmp = [];
                    _v.forEach(_r => {
                        _tmp.push(me.resolve(ep.entity, _r, false));
                    });
                    result[ep.name] = _tmp;
                }
            } else {
                let _v = instance[ep.name];
                if (_v != null) {
                    result[ep.name] = this.resolve(ep.entity, _v, false);
                    result[ep.name]['_keyName'] = ep.entity._keyName;
                    result[ep.name]['_pluralName'] = ep.entity._pluralName;
                }
            }
        }

        if (result['onFetch'] !== 'undefined' && result["onFetch"] != null  && typeof result["onFetch"] === 'function') {
            result['onFetch']();
        }
        return result as T;
    }


    private updateCM(prototype: any, instance: any): void {
        let key = prototype._pluralName + ':' + instance[prototype._keyName];
        let change = {};
        this.changemanager[key] = change;

        for (let prop in prototype) {
            if (this.ignoreColumn(prop)) continue;
            if (prototype.hasOwnProperty(prop) && typeof prototype[prop] != 'function') {
                let v = instance[prop];
                if (v = null) continue;
                let done = false;

                if (v instanceof EntityReference) {
                    change[prop] = v.clone();
                    done = true;
                }

                if (!done && v instanceof OptionSetValue) {
                    change[prop] = v.clone();
                    done = true;
                }

                if (!done && v instanceof Date) {

                    change[prop] = new Date(v.valueOf());
                    done = true;
                }

                if (!done) {
                    change[prop] = v;
                    done = true;
                }
            }
        }
    }

    private columnBuilder(entity: Entity): ColumnBuilder {
        let hasEntityReference: boolean = false;
        let columns: string = entity._keyName;
        for (var prop in entity) {
            if (prop == entity._keyName) continue;
            if (this.ignoreColumn(prop)) continue;

            let v = entity[prop];
            if (typeof v !== 'undefined' && v != null) {
                if (Array.isArray(v)) {
                    continue;
                }
                if (v instanceof Entity) {
                    continue;
                }
            }

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

    private getExpandProperty(entity: Entity): ExpandProperty {
        for (var prop in entity) {
            if (prop == entity._keyName) continue;
            if (this.ignoreColumn(prop)) continue;

            let _v = entity[prop];
            if (Array.isArray(_v)) {
                if (_v.length > 0) {
                    let pt = _v[0] as Entity;
                    return {
                        name: pt._pluralName,
                        entity: pt,
                        isArray: true
                    }
                }
            } else {
                if (_v instanceof Entity) {
                    return {
                        name: prop,
                        entity: _v,
                        isArray: false
                    }
                }
            }
        }
        return null;    
    }

    private ignoreColumn(prop: string): boolean {
        if (prop == "_pluralName" || prop == "_keyName" || prop == "id" || prop == '_updateable' || prop == '$expand') {
            return true;
        }
        return false;
    }
}