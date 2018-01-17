import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { XrmQueryResult } from './xrm.service';
import { XrmContextService, Entity, OptionSetValue, Condition, Comparator } from './xrmcontext.service';

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
    Attributes: AttributeMeta[] = null;

    meta(): EntityMeta {
        this.Attributes = [new AttributeMeta()];
        return this;
    }
}

export class AttributeMeta extends Entity {
    constructor() {
        super("Attributes", "MetadataId")
    }
    AttributeType: OptionSetValue = new OptionSetValue();
    DisplayName: LabelMeta = null;
    LogicalName: string = null;
    Description: LabelMeta = null;
    SchemaName: string = null;

    // virtual properties for ui purpose
    selected: boolean;

    onFetch() {
        this.selected = false;
    }
}


@Injectable()
export class MetadataService {
    private searchEntityMetaPrototype = new EntityMeta();
    private getEntityMetaPrototype = new EntityMeta().meta();

    constructor(private xrmService: XrmContextService) { }

    search(name: string): Observable<XrmQueryResult<EntityMeta>> {
        let con = new Condition()
            .where("LogicalCollectionName", Comparator.ContainsData)
            .where("LogicalName", Comparator.ContainsData);

        return this.xrmService.query<EntityMeta>(this.searchEntityMetaPrototype, con).map(r => {
            if (name != null && name != '') {
                let _s = name.toLowerCase();
                let ma = [];
                // Metadata api does not support contains - therefore client site filter
                r.value.forEach(e => {
                    if (e.LogicalName.toLowerCase().indexOf(_s) >= 0) {
                        ma.push(e);
                    }
                });
                r.value = ma;
            }

            r.value = r.value.sort((a, b) => a.LogicalName.toLowerCase().localeCompare(b.LogicalName.toLowerCase()))
            return r;
        });
    }

    get(id: string): Observable<EntityMeta> {
        return this.xrmService.get(this.getEntityMetaPrototype, id).map(r => {
            if (r.Attributes != null && r.Attributes.length > 0) {
                r.Attributes = r.Attributes.sort((a, b) => {
                    if (a.LogicalName == null && b.LogicalName != null) return 1;
                    if (a.LogicalName != null && b.LogicalName == null) return -1;
                    if (a.LogicalName == null && b.LogicalName == null) return 0;
                    return a.LogicalName.toLowerCase().localeCompare(b.LogicalName.toLowerCase())
                })
            }
            return r;
        });
    }
}