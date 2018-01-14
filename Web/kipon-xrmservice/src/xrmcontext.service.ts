import { Injectable } from '@angular/core';
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

export class Filter {
    field: string;
    operator: Comparator;
    value: any;

    toString(): string {
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

    toString(): string {
        let me = this;
        let result = '';
        let opr = '';
        if (this.filter != null && this.filter.length > 0) {
            this.filter.forEach(r => {
                result += opr + r.toString();
                if (me.operator == Operator.And) {
                    opr = ' and ';
                } else {
                    opr = ' or ';
                }

            });
        }

        if (this.children != null && this.children.length > 0) {
            this.children.forEach(c => {
                result += opr + "(" + c.toString() + ")";
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


class ColumnBuilder {
    columns: string = null;
    hasEntityReference: boolean = false;
}

@Injectable()
export class XrmContextService {
    context: any = {};
    cm: any = {};

    c: Condition = {
        operator: Operator.And,
        filter: [
            {
                field: 'parentcustomerid', operator: Comparator.Equals, value: ''
            }
        ],
        children: null
    }


    constructor(private xrmService: XrmService) { }

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
        let fields = this.columnBuilder(prototype);
        let filter = condition.toString();

        return this.xrmService.query<T>(prototype._pluralName, fields.columns, filter, orderBy, top, count).map(r => {
            let values = r.value;
            r.value = [];
            values.forEach(v => {
                r.value.push(me.resolve(prototype, v, prototype._updateable));
            });

            if (r.prev != null || r.next != null) {
                r.map = (v: XrmQueryResult<T>): XrmQueryResult<T> => {
                    let nvs = v.value;
                    v.value = [];
                    nvs.forEach(nn => {
                        v.value.push(me.resolve(prototype, nn, prototype._updateable));
                    });
                    return v;
                }
            }
            return r;
        });
    }

    private resolve<T extends Entity>(prototype: T, instance: any, updateable: boolean): T {
        let key = prototype._pluralName + ':' + instance[prototype._keyName];
        let result = instance;
        let change = null;
        if (this.context.hasOwnProperty(key)) {
            result = this.context[key];
        } else {
            this.context[key] = instance;
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