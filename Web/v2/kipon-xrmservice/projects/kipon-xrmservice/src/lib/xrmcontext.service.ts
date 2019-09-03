import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse, HttpErrorResponse, HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs';
import { map, catchError, startWith } from 'rxjs/operators'

import { XrmService, XrmEntityKey, XrmQueryResult, Expand } from './xrm.service';
import { XrmContext } from './xrmform.service';

export interface ToFunctionPropertyValue {
  functionPropertyValueAsString(): string;
}

export class FunctionPropertyValue implements ToFunctionPropertyValue {
  private v: string = '';
  constructor(v: string) {
    this.v = v;
  }

  functionPropertyValueAsString(): string {
    return this.v;
  }
}

export class Entity {
  _pluralName: string;
  _keyName: string;
  _updateable: boolean = false;
  _logicalName: string;
  id: string;
  constructor(pluralName: string, keyName: string);
  constructor(pluralName: string, keyName: string, updateable: boolean);
  constructor(pluralName: string, keyName: string, updateable: boolean, logicalname: string);
  constructor(pluralName: string, keyName: string, updateable: boolean = false, logicalname: string = null) {
    this._pluralName = pluralName;
    this._keyName = keyName;
    this._updateable = updateable;

    if (logicalname != null && logicalname != '') {
      this._logicalName = logicalname;
    } else {
      switch (this._pluralName.toLowerCase()) {
        case "emails": this._logicalName = "email"; break;
        case "appointments": this._logicalName = "appointment"; break;
        case "letters": this._logicalName = "letter"; break;
        case "phonecalls": this._logicalName = "phonecall"; break;
        case "tasks": this._logicalName = "task"; break;
        default: {
          this._logicalName = this._keyName.substr(0, (this._keyName.length - 2)).toLowerCase();
          break;
        }
      }
    }
  }
}

export class Entities<T extends Entity> extends Array<T> {
  constructor(fType: string, tType: string, refName: string, leftToRight: boolean, t: T) {
    super(0);
    Object.setPrototypeOf(this, new.target.prototype);
    this.parentType = fType;
    this.childType = tType;
    this.refName = refName;
    this.leftToRight = leftToRight;
    this.push(t);
  }

  private parentType: string;
  private parentId: string;
  private childType: string;
  private refName: string;
  private leftToRight: boolean;
  private xrmService: XrmService;

  add(entity: Entity): Observable<null> {
    let fromType = this.parentType;
    let fromId = this.parentId;
    let toType = this.childType;
    let toId = entity.id;

    if (!this.leftToRight) {
      fromType = this.childType;
      fromId = entity.id;
      toType = this.parentType;
      toId = this.parentId;
    }
    return this.xrmService.associate(fromType, fromId, toType, toId, this.refName).pipe(map(r => {
      this.push(entity as T);
      return null;
    }));
  }

  remove(entity: Entity): Observable<null> {
    let fromType = this.parentType;
    let fromId = this.parentId;
    let toType = this.childType;
    let toId = entity.id;

    if (!this.leftToRight) {
      fromType = this.childType;
      fromId = entity.id;
      toType = this.parentType;
      toId = this.parentId;
    }

    return this.xrmService.disassociate(fromType, fromId, toType, toId, this.refName).pipe(map(r => {
      var index = this.indexOf(entity as T);
      if (index >= 0) {
        this.splice(index, 1);
      }
      return null;
    }));
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

  replace(v1: string, v2: string) {
    this.id.replace(v1, v2);
  }

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

  toJsonProperty(): any {
    return { '@odata.id' : "'" + this.pluralName + "(" + this.id.replace("{", "").replace("}", "") + ")"  + "'"};
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

  toJsonProperty(): any {
    return this.value;
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
  NotEndsWith,
  GreaterThan,
  GreaterThanOrEqual,
  LessThan,
  LessThanOrEQual
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

    if (prototype[this.field] instanceof OptionSetValue) {
      if (this.value != null && this.value.hasOwnProperty('value')) {
        _v = this.value.value;
      }
    }


    let isEref = false;
    if (prototype[this.field] instanceof EntityReference) {
      _f = "_" + this.field + "_value";
      if (this.value != null) {
        if (typeof this.value == 'string') {
          _v = this.value.replace('{', '').replace('}', '');
        } else {
          _v = this.value.id.replace('{', '').replace('}', '');
        }
      }
      isEref = true;
    }

    if (!isEref && _f.startsWith('_') && _f.endsWith('_value') && _v != null && this.value != null) {
      if (typeof this.value === "string") {
        _v = this.value.replace('{', '').replace('}', '');
      } else {
        if (this.value.hasOwnProperty("id")) {
          _v = this.value.id.replace('{', '').replace('}', '');
        }
      }
    }

    var isDate = false;
    if (prototype[this.field] instanceof Date) {
      if (this.value instanceof Date) {
        _v = this.value.toISOString();
      } else {
        _v = this.value.toString();
      }
      isDate = true;
    }

    if (!isDate && this.value instanceof Date) {
      _v = this.value.toISOString();
      isDate = true;
    }

    if (_f == prototype._keyName) {
      _v = this.value.replace('{', '').replace('}', '');
    }

    if (_v != null && _v != '') {
      _v = encodeURIComponent(_v);
    }

    switch (this.operator) {
      case Comparator.Equals: {
        return _f + ' eq ' + _v;
      }
      case Comparator.NotEquals: {
        return _f + ' ne ' + _v;
      }
      case Comparator.GreaterThan: {
        return _f + ' gt ' + _v;
      }
      case Comparator.GreaterThanOrEqual: {
        return _f + ' ge ' + _v;
      }
      case Comparator.LessThan: {
        return _f + ' lt ' + _v;
      }
      case Comparator.LessThanOrEQual: {
        return _f + ' le ' + _v;
      }
      case Comparator.Contains: {
        return "contains(" + _f + "," + _v + ")";
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

  where(field: string, opr: Comparator): Condition;
  where(field: string, opr: Comparator, value: any): Condition;
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

class XrmTransactionItem {
  constructor(type: string, prototype: Entity, instance: Entity);
  constructor(type: string, prototype: Entity, instance: Entity, field: string, value: any);
  constructor(type: string, prototype: Entity, instance: Entity, field: string = null, value: any = null) {
    this.type = type;
    this.prototype = prototype;
    this.instance = instance;
    this.field = field;
    this.value = value;
  }

  type: string;
  prototype: Entity;
  instance: Entity;
  field: string;
  value: any;
  id: number = null;
}


export class XrmTransaction {
  private oprs: XrmTransactionItem[] = [];

  put<T extends Entity>(prototype: T, instance: T, field: string, value: any): void {
    this.oprs.push(new XrmTransactionItem("put", prototype, instance, field, value));
  }

  delete<T extends Entity>(instance: T): void {
    this.oprs.push(new XrmTransactionItem("delete", null, instance));
  }

  create<T extends Entity>(prototype: T, instance: T): void {
    this.oprs.push(new XrmTransactionItem("create", prototype, instance));
  }

  update<T extends Entity>(prototype: T, instance: T): void {
    this.oprs.push(new XrmTransactionItem("update", prototype, instance));
  }
}

export class XrmAccess {
  private lazy: boolean = null;
  resolved: boolean = null;
  read: boolean;
  write: boolean;
  append: boolean;
  appendTo: boolean;
  create: boolean;
  delete: boolean;
  share: boolean;
  assign: boolean;

  constructor();
  constructor(lasy: boolean);
  constructor(lazy: boolean = false) {
    this.lazy = lazy;
  }
}

class ExpandProperty {
  name: string;
  entity: Entity;
  isArray: boolean;
  value: any;
}

@Injectable()
export class XrmContextService {
  private context: any = {};
  private changemanager: any = {};
  private tick: number = new Date().valueOf();

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

  getCurrentUserId(): Observable<string> {
    return this.xrmService.getCurrentUserId();
  }

  get<T extends Entity>(prototype: T, id: string): Observable<T> {
    let me = this;
    let columnDef = this.columnBuilder(prototype);

    let expand: Expand = null;

    let eps = this.getExpandProperties(prototype);
    if (eps != null && eps.length > 0) {
      let comma = ",";
      eps.forEach(ep => {
        if (expand == null) {
          expand = this.$expandToExpand(ep);
        } else {
          if (expand.additional == null) {
            expand.additional = [];
          }
          expand.additional.push(this.$expandToExpand(ep));
        }
      });
    }

    return this.xrmService.get<T>(prototype._pluralName, id, columnDef.columns, expand).pipe(map(r => {
      return me.resolve<T>(prototype, r, prototype._updateable);
    }));
  }

  debug(setting: boolean): void {
    this.xrmService.debug = setting;
  }

  query<T extends Entity>(prototype: T, condition: Condition): Observable<XrmQueryResult<T>>;
  query<T extends Entity>(prototype: T, condition: Condition, orderBy: string): Observable<XrmQueryResult<T>>;
  query<T extends Entity>(prototype: T, condition: Condition, orderBy: string, top: number): Observable<XrmQueryResult<T>>;
  query<T extends Entity>(prototype: T, condition: Condition, orderBy: string, top: number, count: boolean): Observable<XrmQueryResult<T>>;
  query<T extends Entity>(prototype: T, condition: Condition, orderBy: string = null, top: number = 0, count: boolean = false): Observable<XrmQueryResult<T>> {
    let me = this;
    let fields = this.columnBuilder(prototype).columns;

    let con = condition;
    let filter = null;
    if (condition != null) {
      while (con.parent != null) { con = con.parent };

      filter = con.toQueryString(prototype);
    }

    let headers = new HttpHeaders({ 'Accept': 'application/json' });
    if (this.xrmService.token != null) {
      headers = headers.append("Authorization", "Bearer " + this.xrmService.token);
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

    this.xrmService.log(url);

    return this.http.get(this.forceHTTPS(url), options).pipe(map(response => {
      let result = me.resolveQueryResult<T>(prototype, response, top, [url], 0);
      return result;
    }));
  }

  create<T extends Entity>(prototype: T, instance: T): Observable<T> {
    let newr = this.prepareNewInstance(prototype, instance);
    this.xrmService.log(newr);

    return this.xrmService.create<T>(prototype._pluralName, newr as T).pipe(map(_response => {
      let response = _response as T;
      this.xrmService.log(response);

      if (response != null) {
        if (response.hasOwnProperty('$keyonly')) {
          instance._pluralName = prototype._pluralName;
          instance._logicalName = prototype._logicalName;
          instance._keyName = prototype._keyName;
          instance.id = _response.id;
          instance._updateable = true;

          let key = response._pluralName + ':' + response.id;
          for (let prop in prototype) {
            if (typeof prototype[prop] === 'function') {
              response[prop] = prototype[prop];
              continue;
            }
          }

          this.context[key] = instance;
          this.updateCM(prototype, instance);

          return instance;
        } else {
          this.resolveNewInstance(prototype, instance, response);
          return this.resolve(prototype, response, true);
        }
      }
      return null;
    }));
  }

  createAll<T extends Entity>(prototype: T, instances: T[]): Observable<null> {
    if (prototype != null && instances != null && instances.length > 0) {
      let trans = new XrmTransaction();
      instances.forEach(r => {
        trans.create(prototype, r);
      });

      return this.commit(trans);
    }
    throw "You must parse a prototype and at least one instance to be created";
  }

  update<T extends Entity>(prototype: T, instance: T): Observable<T> {
    let me = this;
    let upd = this.prepareUpdate(prototype, instance);

    if (upd == null) {
      upd = {};
    }

    this.xrmService.log(upd);

    let fields = this.columnBuilder(prototype).columns;

    return this.xrmService.update<T>(prototype._pluralName, upd as T, instance.id, fields).pipe(map(response => {
      var wasnull = response[prototype._keyName] == null || response[prototype._keyName] == '';

      if (wasnull || this.getContext().getVersion().startsWith("8.0") || this.getContext().getVersion().startsWith("8.1")) {
        this.xrmService.log('version 8.0 update');
        this.updateCM(prototype, instance);
        return instance;
      }

      this.xrmService.log('version 8.2 or higher update');
      return me.resolve(prototype, response, true);
    }));
  }

  put(prototype: Entity, instance: Entity, field: string): Observable<null>;
  put(prototype: Entity, instance: Entity, field: string, value: any): Observable<null>;
  put(prototype: Entity, instance: Entity, field: string, value: any = 'ko-@value-not-parsed!'): Observable<null> {
    let v = value;
    if (value == 'ko-@value-not-parsed!') {
      v = instance[field];
    }

    let pvx = this.preparePutValue(prototype, field, v);
    return this.xrmService.put(prototype._pluralName, instance.id, pvx.field, pvx.value, pvx.propertyAs).pipe(map(response => {
      if (value != 'ko-@value-not-parsed!') {
        this.assignValue(prototype, instance, field, value);
        return null;
      }
    }));
  }

  putAll(prototype: Entity, instances: Entity[], field: string, value: any): Observable<null> {
    if (instances != null && instances.length == 1) {
      return this.put(prototype, instances[0], field, value);
    }

    if (instances != null && instances.length > 0) {
      let trans = new XrmTransaction();
      instances.forEach(r => {
        trans.put(prototype, r, field, value);
      });
      return this.commit(trans);
    }

    throw 'you must parse at least one instance in the instances array';
  }

  delete<T extends Entity>(t: T): Observable<null> {
    let me = this;
    return this.xrmService.delete(t._pluralName, t.id).pipe(map(r => {
      let key = t._pluralName + ":" + t.id;
      if (me.context.hasOwnProperty(key)) {
        delete me.context[key];
      }
      return null;
    }));
  }

  deleteAll<T extends Entity>(instances: T[]): Observable<null> {
    if (instances != null && instances.length == 1) {
      return this.delete(instances[0]);
    }

    if (instances != null && instances.length > 0) {
      let trans = new XrmTransaction();
      instances.forEach(r => {
        trans.delete(r);
      });
      return this.commit(trans);
    }
    throw 'you must parse at least one instance in the instances array';
  }

  /* marked private becase the api is not well tested yet, to avoi */
  func(name: string, data: any): Observable<any>;
  func(name: string, data: any, entity: Entity): Observable<any>;
  func(name: string, data: any, entity: Entity = null): Observable<any> {
    var parameters = data;
    if (parameters != null) {
      parameters = this.toFuncParameterString(data);
    }

    if (entity == null) {
      return this.xrmService.func(name, parameters);
    } else {
      return this.xrmService.func(name, parameters, entity._pluralName, entity.id);
    }
  }


  action(name: string, data: any): Observable<any>;
  action(name: string, data: any, entity: Entity): Observable<any>;
  action(name: string, data: any, entity: Entity = null): Observable<any> {
    if (entity != null) {
      return this.xrmService.action(name, data, entity._pluralName, entity.id);
    } else {
      return this.xrmService.action(name, data);
    }
  }

  commit(transaction: XrmTransaction): Observable<null> {
    let oprs = transaction["oprs"] as XrmTransactionItem[];

    if (oprs != null && oprs.length > 0) {
      this.tick++;
      let batch = 'batch_KO' + new Date().valueOf() + "$" + this.tick.toString();
      let change = 'changeset_KO' + new Date().valueOf() + "!" + this.tick.toString();
      let headers = new HttpHeaders({ 'Accept': 'application/json' });
      if (this.xrmService.token != null) {
        headers = headers.append("Authorization", "Bearer " + this.xrmService.token);
      }
      headers = headers.append("Content-Type", "multipart/mixed;boundary=" + batch);
      headers = headers.append("OData-MaxVersion", "4.0");
      headers = headers.append("OData-Version", "4.0");

      let body = '--' + batch + "\n";
      body += "Content-Type: multipart/mixed;boundary=" + change + "\n";
      body += "\n";

      let count = 1;
      oprs.forEach(r => {
        r.id = count;
        if (r.type == "put") {
          let nextV = this.preparePutValue(r.prototype, r.field, r.value);
          body += '--' + change + "\n";
          body += "Content-Type: application/http\n";
          body += "Content-Transfer-Encoding:binary\n";
          body += "Content-ID: " + count.toString() + "\n";
          body += "\n";
          if (nextV.value != null) {
            body += "PUT " + this.getContext().$devClientUrl() + r.prototype._pluralName + "(" + r.instance.id + ")/" + nextV.field + " HTTP/1.1\n";
          } else {
            body += "DELETE " + this.getContext().$devClientUrl() + r.instance._pluralName + "(" + r.instance.id + ")/" + nextV.field + " HTTP/1.1\n";
          }

          let xr = {};
          if (nextV.value != null) {
            xr[nextV.propertyAs] = nextV.value;
          }
          body += "Content-Type: application/json;type=entry\n";
          body += "\n";
          body += JSON.stringify(xr) + "\n";
        }

        if (r.type == "delete") {
          body += '--' + change + "\n";
          body += "Content-Type: application/http\n";
          body += "Content-Transfer-Encoding:binary\n";
          body += "Content-ID: " + count.toString() + "\n";
          body += "\n";
          body += "DELETE " + this.getContext().$devClientUrl() + r.instance._pluralName + "(" + r.instance.id + ")" + " HTTP/1.1\n";
          body += "Content-Type: application/json;type=entry\n";
          body += "\n";
          body += "{ }\n";
        }

        if (r.type == "create") {
          let nextI = this.prepareNewInstance(r.prototype, r.instance);
          body += '--' + change + "\n";
          body += "Content-Type: application/http\n";
          body += "Content-Transfer-Encoding:binary\n";
          body += "Content-ID: " + count.toString() + "\n";
          body += "\n";
          body += "POST " + this.getContext().$devClientUrl() + r.prototype._pluralName + " HTTP/1.1\n";
          body += "Content-Type: application/json;type=entry\n";
          body += "\n";
          body += JSON.stringify(nextI) + "\n";
        }

        if (r.type == "update") {
          let nextU = this.prepareUpdate(r.prototype, r.instance);
          if (nextU != null) {
            let fields = "?$select=" + this.columnBuilder(r.prototype).columns;

            body += '--' + change + "\n";
            body += "Content-Type: application/http\n";
            body += "Content-Transfer-Encoding:binary\n";
            body += "Content-ID: " + count.toString() + "\n";
            body += "\n";
            body += "PATCH " + this.getContext().$devClientUrl() + r.prototype._pluralName + "(" + r.instance.id + ")" + fields + " HTTP/1.1\n";
            body += "Content-Type: application/json;type=entry\n";
            body += "\n";
            body += JSON.stringify(nextU) + "\n";
          }
        }
        count++;
      });
      body += '--' + change + '--\n';
      body += "\n";
      body += "--" + batch + "--\n";
      this.xrmService.log(body);

      let url = this.getContext().getClientUrl() + this.xrmService.apiUrl + "$batch";
      this.xrmService.log(url);


      return this.http.post(this.forceHTTPS(url), body, { headers: headers, responseType: "text" }).pipe(map(_txt => {
        let txt = _txt as string;
        this.xrmService.log(txt);

        oprs.forEach(r => {
          if (r.type == 'put') {
            this.assignValue(r.prototype, r.instance, r.field, r.value);
            this.updateCM(r.prototype, r.instance);
          }

          if (r.type == 'update') {
            this.updateCM(r.prototype, r.instance);
          }

          if (r.type == 'delete') {
            let key = r.instance._pluralName + ':' + r.instance.id;
            delete this.context[key];
            delete this.changemanager[key];
          }
        });

        let index: number = 0;
        txt.split('\n').forEach(l => {
          if (l.startsWith('Content-ID:')) {
            index = Number(l.split(':')[1].trim());
            return true;
          }
          if (l.startsWith('OData-EntityId:')) {
            let opr = oprs.find(o => o.id == index);

            if (opr != null && opr.type == 'create') {
              let id = l.split('OData-EntityId:')[1].split('/' + opr.prototype._pluralName + '(')[1].replace(')', '').trim();
              opr.instance.id = id;
              let key = opr.prototype._pluralName + ':' + opr.instance.id;
              this.context[key] = opr.instance;
              opr.instance._updateable = true;
              this.updateCM(opr.prototype, opr.instance);
            }
          }
          return true;
        });
        return null;
      }));
    }
    throw 'you must parse at least one operation to the transaction by calling put, create, update or delete';
  }


  log(type: string): void {
    if (type == 'context') {
      this.xrmService.log(this.context);
      return;
    }

    if (type == 'xrmcontext') {
      this.xrmService.log(this.getContext());
      return;
    }

    if (type == 'url') {
      this.xrmService.log(this.getContext().getClientUrl());
    }

    if (type == 'version') {
      this.xrmService.log(this.getContext().getVersion());
    }

    this.xrmService.log('xrmContextService supported the current log types: context, xrmcontext, url, version');
  }

  clone(prototype: Entity, instance: Entity): Entity {
    let r = new Entity(prototype._pluralName, prototype._keyName);
    for (let prop in prototype) {
      if (this.ignoreColumn(prop)) continue;

      let pv = prototype[prop];
      if (typeof pv == 'function') {
        r[prop] = pv;
        continue;
      }

      let v = instance[prop];

      if (v == null) {
        r[prop] = null;
        continue;
      }

      if (v instanceof Date) {
        r[prop] = new Date(v.valueOf());
        continue;
      }

      if (v instanceof EntityReference) {
        r[prop] = v.clone();
        continue;
      }

      if (v instanceof OptionSetValue) {
        r[prop] = v.clone();
        continue;
      }

      if (v != null) {
        r[prop] = v;
      }
    }
    r.id = null;
    this.xrmService.log('clone');
    this.xrmService.log(r);

    return r;
  }

  applyAccess(prototype: Entity, instance: Entity): Observable<Entity> {
    if (!prototype.hasOwnProperty('access')) throw 'The metadata must define a property "access" of type XrmAccess';

    if (instance.hasOwnProperty('access') && instance['access']['resolved']) {
      return Observable.create(obs => obs.next(instance));
    }

    return this.mapAccess(prototype, instance);
  }

  private prepareUpdate(prototype: Entity, instance: Entity): any {
    let me = this;
    let upd = {
    }

    let countFields = 0;

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

        if (instance[prop] instanceof EntityReference) {
          if (instance[prop].associatednavigationproperty != null && instance[prop].associatednavigationproperty != '' && instance[prop]['pluralName'] != null && instance[prop]['pluralName'] != '') {
            if (!EntityReference.same(prevValue, newValue)) {
              if (newValue != null && newValue["id"] != null && newValue["id"] != '') {
                let x = newValue["id"] as string;
                x = x.replace('{', '').replace('}', '');
                upd[instance[prop]['associatednavigationpropertyname']()] = '/' + instance[prop]['pluralName'] + '(' + x + ')';
              } else {
                upd[instance[prop]['associatednavigationpropertyname']()] = null;
              }
              countFields++;
            }
            continue;
          }
        }

        if (prototype[prop] instanceof EntityReference) {
          if (!EntityReference.same(prevValue, newValue)) {
            if (newValue != null && newValue["id"] != null && newValue["id"] != '') {
              let x = newValue["id"] as string;
              x = x.replace('{', '').replace('}', '');
              upd[prototype[prop]['associatednavigationpropertyname']()] = '/' + prototype[prop]['pluralName'] + '(' + x + ')';
            } else {
              upd[prototype[prop]['associatednavigationpropertyname']()] = null;
            }
            countFields++;
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
            countFields++;
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
            countFields++;
          }
          continue;
        }

        if (prevValue === true && newValue === true) {
          continue;
        }

        if (prevValue === false && newValue === false) {
          continue;
        }

        if (prevValue != newValue) {
          this.xrmService.log('pre-value-update:' + prop);
          this.xrmService.log(prevValue);

          this.xrmService.log('new-value-update:' + prop);
          this.xrmService.log(newValue);

          upd[prop.toString()] = instance[prop];
          countFields++;
        }
      }
    }

    if (countFields > 0) {
      return upd;
    }
    return null;
  }

  private resolveAccess(prototype: Entity, instance: Entity) {
    var user = this.getContext().getUserId();
    if (user == null || user == '') {
      setTimeout(() => {
        this.resolveAccess(prototype, instance);
      }, 200);
      return;
    }

    this.mapAccess(prototype, instance).subscribe(r => { });
  }

  private mapAccess(prototype: Entity, instance: Entity): Observable<Entity> {
    if (!prototype.hasOwnProperty('access') || !(prototype['access'] instanceof XrmAccess)) {
      return;
    }

    if (!instance.hasOwnProperty('access')) {
      instance['access'] = new XrmAccess();
    } else {
      let r = instance['access'] as XrmAccess;
      if (r.resolved != null) {
        return;
      }
    }

    var user = this.getContext().getUserId().replace('{', '').replace('}','');

    let r = instance['access'] as XrmAccess;
    r.resolved = false;

    let headers = new HttpHeaders({ 'Accept': 'application/json' });
    if (this.xrmService.token != null) {
      headers = headers.append("Authorization", "Bearer " + this.xrmService.token);
    }
    headers = headers.append("OData-MaxVersion", "4.0");
    headers = headers.append("OData-Version", "4.0");
    headers = headers.append("Content-Type", "application/json; charset=utf-8");
    headers = headers.append("Prefer", "odata.include-annotations=\"*\"");
    headers = headers.append("Cache-Control", "no-cache");

    let url = this.getContext().getClientUrl() + this.xrmService.apiUrl + "systemusers(" + user + ")/Microsoft.Dynamics.CRM.RetrievePrincipalAccess(Target=@tid)?@tid={\"@odata.id\":\"" + prototype._pluralName + "(" + instance.id + ")\"}";
    this.xrmService.log(url);

    let _ta = instance['access'] as XrmAccess;
    _ta.resolved = null;

    return this.http.get(this.forceHTTPS(url), { headers: headers }).pipe(
      map(r => {
        this.xrmService.log(r);
        let i = instance['access'] as XrmAccess;
        let perm = r["AccessRights"] as string;
        // ReadAccess, WriteAccess, AppendAccess, AppendToAccess, CreateAccess, DeleteAccess, ShareAccess, AssignAccess
        i.append = perm.indexOf('AppendAccess') >= 0;
        i.appendTo = perm.indexOf('AppendToAccess') >= 0
        i.assign = perm.indexOf('AssignAccess') >= 0;
        i.create = perm.indexOf('CreateAccess') >= 0;
        i.delete = perm.indexOf('DeleteAccess') >= 0;
        i.read = perm.indexOf('ReadAccess') >= 0;
        i.share = perm.indexOf('ShareAccess') >= 0;
        i.write = perm.indexOf('WriteAccess') >= 0;
        i.resolved = true;
        return instance;
      })
    );
  }

  private preparePutValue(prototype: Entity, field: string, value: any): any {
    let t = prototype[field];

    if (t instanceof OptionSetValue) {
      if (value == null || value['value'] == null) {
        return { field: field, value: null, propertyAs: 'value' };
      } else {
        return { field: field, value: value['value'], propertyAs: 'value' };
      }
    }

    if (typeof t == 'number' && typeof value == 'number') {
      if (value == null) {
        return { field: field, value: null, propertyAs: null };
      } else {
        // this is a really really stupid hack, because dynamics do not accept Integer for decimal fields, so we force 
        // a decimal position into the value before it is send.
        let rv = value + t;
        return { field: field, value: rv, propertyAs: 'value' };
      }
    }

    if (t instanceof EntityReference) {
      field = t.associatednavigationpropertyname().split('@')[0] + "/$ref";

      if (value.id == null || value.id == '') {
        return { field: field, value: null, propertyAs: '@odata.id', isDefault: false };
      } else {
        return { field: field, value: this.getContext().$devClientUrl() + t.pluralName + "(" + value.id + ")", propertyAs: '@odata.id', isdecimal: false };
      }
    }

    if (value instanceof Date) {
      return { field: field, value: value.toISOString(), propertyAs: 'value' };
    }

    return { field: field, value: value, propertyAs: 'value' };
  }

  private prepareNewInstance(prototype: Entity, instance: Entity): any {
    let newr = {};

    for (let prop in prototype) {
      if (prototype.hasOwnProperty(prop) && typeof prototype[prop] !== 'function') {
        if (this.ignoreColumn(prop)) continue;

        let value = instance[prop];
        if (value !== 'undefined' && value !== null) {

          if (instance[prop] instanceof EntityReference) {
            if (instance[prop].associatednavigationproperty != null && instance[prop].associatednavigationproperty != '' && instance[prop]['pluralName'] != null && instance[prop]['pluralName'] != '') {
              let ref = instance[prop] as EntityReference;
              if (ref != null && ref.id != null) {
                newr[instance[prop]['associatednavigationpropertyname']()] = '/' + instance[prop]['pluralName'] + '(' + ref.id.replace('{', '').replace('}', '') + ')';
              }
              continue;
            }
          }

          if (prototype[prop] instanceof EntityReference) {
            let ref = instance[prop] as EntityReference;
            if (ref != null && ref.id != null) {
              newr[prototype[prop]['associatednavigationpropertyname']()] = '/' + prototype[prop]['pluralName'] + '(' + ref.id.replace('{', '').replace('}', '') + ')';
            }
            continue;
          }

          if (prototype[prop] instanceof OptionSetValue) {
            let o = instance[prop] as OptionSetValue;
            if (o != null && o.value != null) {
              newr[prop.toString()] = o.value;
            }
            continue;
          }

          if (prototype[prop] instanceof Date) {
            let d = value as Date;
            if (d != null) {
              newr[prop.toString()] = d.toISOString();
            }
            continue;
          }

          newr[prop.toString()] = instance[prop];
        }
      }
    }
    return newr;
  }

  private assignValue(prototype: Entity, instance: Entity, prop: string, value: any) {
    if (value != null) {
      instance[prop] = value;
      return;
    }

    let t = prototype[prop];
    if (t instanceof EntityReference) {
      instance[prop] = t.clone();
      return;
    }

    if (t instanceof OptionSetValue) {
      instance[prop] = new OptionSetValue();
      return;
    }

    instance[prop] = null;
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

  private resolveQueryResult<T extends Entity>(prototype: T, response: any, top: number, pages: string[], pageIndex: number): XrmQueryResult<T> {
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
          if (this.xrmService.token != null) {
            headers = headers.append("Authorization", "Bearer " + this.xrmService.token);
          }
          headers = headers.append("OData-MaxVersion", "4.0");
          headers = headers.append("OData-Version", "4.0");
          headers = headers.append("Content-Type", "application/json; charset=utf-8");
          if (top > 0) {
            headers = headers.append("Prefer", "odata.include-annotations=\"*\",odata.maxpagesize=" + top.toString());
          } else {
            headers = headers.append("Prefer", "odata.include-annotations=\"*\"");
          }
          headers = headers.append("Cache-Control", "no-cache");

          let options = {
            headers: headers
          }
          return me.http.get(me.forceHTTPS(nextLink), options).pipe(map(r => {
            pages.push(nextLink);
            let pr = me.resolveQueryResult<T>(prototype, r, top, pages, pageIndex + 1);
            return pr;
          }));
        }
      }
    }

    if (result.pageIndex >= 1) {
      result.prev = (): Observable<XrmQueryResult<T>> => {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        if (this.xrmService.token != null) {
          headers = headers.append("Authorization", "Bearer " + this.xrmService.token);
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
        return me.http.get(me.forceHTTPS(lastPage), options).pipe(map(r => {
          result.pages.splice(result.pages.length - 1, 1);
          let pr = me.resolveQueryResult<T>(prototype, r, top, result.pages, result.pageIndex - 1);
          return pr;
        }));
      }
    }
    return result;
  }

  private resolveNewInstance<T extends Entity>(prototype: T, instance: any, result: any): void {
    let key = prototype._pluralName + ':' + instance[prototype._keyName];
    instance["id"] = result[prototype._keyName];
    instance["_pluralName"] = prototype._pluralName;
    instance["_logicalName"] = prototype._logicalName;
    instance["_keyName"] = prototype._keyName;
    this.context[key] = instance;
  }

  private resolve<T extends Entity>(prototype: T, instance: any, updateable: boolean): T {
    let me = this;

    this.xrmService.log("Result from update: ");
    this.xrmService.log(instance);

    let key = prototype._pluralName + ':' + instance[prototype._keyName];
    let result = instance;

    if (this.context.hasOwnProperty(key)) {
      result = this.context[key];
    } else {
      this.context[key] = result;
      result["id"] = instance[prototype._keyName];
      result["_pluralName"] = prototype._pluralName;
      result["_logicalName"] = prototype._logicalName;
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
          let id = instance["_" + prop + "_value"] as string;
          if (id != null && id != 'undefined') {
            ref.id = id.toLowerCase();
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

    let eps = this.getExpandProperties(prototype);

    if (eps != null && eps.length > 0) {

      eps.forEach(ep => {
        if (ep != null) {
          if (ep.isArray) {
            let _v = instance[ep.name];
            if (_v != null && Array.isArray(_v)) {
              let _tmp = [];
              _v.forEach(_r => {
                _tmp.push(me.resolve(ep.entity, _r, false));
              });
              result[ep.name] = _tmp;
              if (ep.value instanceof Entities) {
                _tmp["add"] = ep.value["add"];
                _tmp["remove"] = ep.value["remove"];
                _tmp["xrmService"] = this.xrmService;
                _tmp["parentType"] = prototype._pluralName;
                _tmp["parentId"] = result["id"];
                _tmp["childType"] = ep.value["childType"];
                _tmp["refName"] = ep.value["refName"];
                _tmp["leftToRight"] = ep.value["leftToRight"];
              }
            }
          } else {
            let _v = instance[ep.name];
            if (_v != null) {
              result[ep.name] = this.resolve(ep.entity, _v, false);
              result[ep.name]['_keyName'] = ep.entity._keyName;
              result[ep.name]['_pluralName'] = ep.entity._pluralName;
              result[ep.name]['_logicalName'] = ep.entity._logicalName;
            }
          }
        }
      });
    }

    if (result['onFetch'] !== 'undefined' && result["onFetch"] != null && typeof result["onFetch"] === 'function') {
      result['onFetch']();
    }

    if (prototype.hasOwnProperty('access') && !prototype['access']['lazy']) {
      if (!result.hasOwnProperty('access') || result.access.resolved == null) {
        this.resolveAccess(prototype, result);
      }
    }

    if (updateable) {
      this.updateCM(prototype, result);
    }

    return result as T;
  }


  private updateCM(prototype: any, instance: any): void {
    let key = prototype._pluralName + ':' + instance['id'];
    let change = {};

    this.xrmService.log('Adding to cm ' + key);

    this.changemanager[key] = change;

    for (let prop in prototype) {
      if (this.ignoreColumn(prop)) continue;
      if (prototype.hasOwnProperty(prop) && typeof prototype[prop] != 'function') {
        let v = instance[prop];
        if (v == null) continue;

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
    this.xrmService.log(change);
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

  private getExpandProperties(entity: Entity): ExpandProperty[] {
    var result = [];
    for (var prop in entity) {
      if (prop == entity._keyName) continue;
      if (this.ignoreColumn(prop)) continue;

      let _v = entity[prop];
      if (Array.isArray(_v)) {
        if (_v.length > 0) {
          let pt = _v[0] as Entity;
          result.push({
            name: prop,
            entity: pt,
            isArray: true,
            value: _v
          });
        }
      } else {
        if (_v instanceof Entity) {
          result.push({
            name: prop,
            entity: _v,
            isArray: false,
            value: _v
          });
        }
      }
    }
    return result;
  }

  private ignoreColumn(prop: string): boolean {
    if (prop == "_pluralName" || prop == "_logicalName" || prop == "_keyName" || prop == "id" || prop == '_updateable' || prop == '$expand' || prop == 'access') {
      return true;
    }
    return false;
  }

  private toFuncParameterString(pam: any): string {
    if (typeof pam === "string") return pam;

    let r = '(';
    var ix = 1;
    var cm = '';
    for (var p in pam) {
      if (pam.hasOwnProperty(p)) {
        r += cm + p + "=@p" + ix;
        ix++;
        cm = ',';
      }
    }
    r += ')';

    ix = 1;
    cm = '?';
    for (var p in pam) {
      if (pam.hasOwnProperty(p)) {
        r += cm + '@p' + ix + "=";

        ix++;
        cm = "&";


        var v = pam[p];

        if (v == null) {
          v = '';
          r += v;
          continue;
        }


        var valueWrapper = v["functionPropertyValueAsString"];
        if (valueWrapper != null) {
          r += valueWrapper.call(v);
          continue;
        }

        if (v.hasOwnProperty("toJsonProperty")) {
          v = v["toJsonProperty"]();
        }

        if (v instanceof Date) {
          r += v.toISOString();
          continue;
        }

        if (typeof v === "number") {
          r += v.toString();
          continue;
        }

        if (typeof v === "boolean") {
          r += v ? "true" : "false";
          continue;
        }

        if (typeof v === "string") {
          r += "'" + v + "'";
          continue;
        }

        r += JSON.stringify(this.transform(v));
      }
    }
    return r;
  }

  private transform(input: any): any {
    var transformed = false;
    var result = {};

    for (var pam in input) {
      if (input.hasOwnProperty(pam)) {
        var value = input[pam];
        if (value != null && value.hasOwnProperty("toJsonProperty")) {
          result[pam] = value["toJsonProperty"]();
          transformed = true;
        } else {
          result[pam] = value;
        }
      }
    }

    if (!transformed) {
      return input;
    }

    return result;
  }

  private forceHTTPS(v: string): string {
    return this.xrmService.forceHTTPS(v);
  }
}
