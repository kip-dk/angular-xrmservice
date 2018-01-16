import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { XrmQueryResult } from './xrm.service';
import { XrmContextService, Entity, Condition, Comparator } from './xrmcontext.service';

export class LabelMeta {
    Label: string;
    LanguageCode: number;
    IsManaged: boolean;
    MetadataId: string;
    HasChanged: boolean;
}

export class DisplayNameMeta {
    LocalizedLabels: LabelMeta[];
    UserLocalizedLabel: LabelMeta;
}

export class EntityMeta extends Entity {
    constructor() {
        super("EntityDefinitions", "MetadataId");
    }

    DisplayName: LabelMeta = null;
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
        let con = new Condition()
            .where("LogicalCollectionName", Comparator.ContainsData)
            .where("LogicalName", Comparator.ContainsData);

        if (name != null && name != '') {
            con.where("LogicalName", Comparator.Contains, name);
        }

        return this.xrmService.query<EntityMeta>(this.entityMetaPrototype, con).map(r => {
            r.value = r.value.sort((a, b) => a.LogicalName.toLowerCase().localeCompare(b.LogicalName.toLowerCase()))
            return r;
        });
    }
}