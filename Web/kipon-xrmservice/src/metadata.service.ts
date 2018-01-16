import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { XrmQueryResult } from './xrm.service';
import { XrmContextService, Entity, Condition, Comparator } from './xrmcontext.service';

export class EntityMeta extends Entity {
    constructor() {
        super("EntityDefinitions", "MetadataId");
    }

    DisplayName: string = null;
    LogicalName: string = null;
    ObjectTypeCode: number = null;
    SchemaName: string = null;
    LogicalCollectionName: string = null;
}


@Injectable()
export class MetadataService {
    private entityMetaPrototype = new EntityMeta();

    constructor(private xrmService: XrmContextService) { }

    search(name: string): Observable<XrmQueryResult<EntityMeta>> {
        let con = new Condition();
        if (name != null && name != '') {
            con.where("DisplayName", Comparator.Contains, name);
        }
        return this.xrmService.query<EntityMeta>(this.entityMetaPrototype, con, 'DisplayName', 250);
    }
}