import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { XrmService, XrmContext, XrmEntityKey } from './xrm.service';

export class Entity {
    _pluralName: string;
    _keyName: string;
    id: string;
    constructor(pluralName: string, keyName: string) {
        this._pluralName = pluralName;
        this._keyName = keyName;
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

class ColumnBuilder {
    columns: string = null;
    hasEntityReference: boolean = false;
}

@Injectable()
export class XrmContextService {
    context: any = {};
    cm: any = {};

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

    get<T extends Entity>(prototype: T, id: string, updateable: boolean): Observable<T> {
        let me = this;
        let columnDef = this.columnBuilder(prototype);

        return this.xrmService.get<T>(prototype._pluralName, id, columnDef.columns).map(r => {
            return me.resolve<T>(prototype, r, updateable);
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
        if (prop == "_pluralName" || prop == "_keyName" || prop == "id") {
            return true;
        }
        return false;
    }
}