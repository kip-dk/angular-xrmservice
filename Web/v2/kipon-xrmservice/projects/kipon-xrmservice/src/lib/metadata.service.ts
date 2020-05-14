import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'

import { XrmService, XrmQueryResult } from './xrm.service';
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
    IsActivity: boolean = null;
    IsActivityParty: boolean = null;
    Attributes: AttributeMeta[] = null;

    OneToManyRelations: OneToManyRelationship[];
    ManyToManyRelations: ManyToManyRelationship[];

    meta(): EntityMeta {
        this.Attributes = [new AttributeMeta()];
        return this;
    }
}

export class AttributeMeta extends Entity {
    constructor() {
        super("Attributes", "MetadataId")
    }
    AttributeType: string = null;
    DisplayName: LabelMeta = null;
    LogicalName: string = null;
    Description: LabelMeta = null;
    SchemaName: string = null;

    // virtual properties for ui purpose
    selected: boolean;
    Lookup: LookupAttribute;

    onFetch() {
        this.selected = false;
    }
}

export class OneToManyRelationship {
    MetadataId: string = null;
    RelationshipType: number = null;
    SchemaName: string = null;
    ReferencedAttribute: string = null;
    ReferencingAttribute: string = null;
    ReferencedEntity: string = null;
    ReferencingEntity: string = null;
    ReferencingEntityNavigationPropertyName: string;
}

export class ManyToManyRelationship {
  MetadataId: string = null;
  Entity1LogicalName: string = null;
  Entity1NavigationPropertyName: string = null;
  Entity2LogicalName: string = null;
  Entity2NavigationPropertyName: string = null;
  SchemaName: string = null;
  RelationshipType: string = null;
  Other: string = null;
  OtherSchemaName: string = null;
  Entity1LogicalCollectionName: string = null;
  Entity2LogicalCollectionName: string = null;
}

export class LookupAttribute {
    Targets: string[];
    LogicalName: string;
    SchemaName: string;
}


@Injectable()
export class XrmMetadataService {
    private searchEntityMetaPrototype = new EntityMeta();
    private getEntityMetaPrototype = new EntityMeta().meta();

    constructor(private http: HttpClient, private xrmService: XrmContextService) { }

    search(name: string): Observable<XrmQueryResult<EntityMeta>>;
    search(name: string, unique: boolean): Observable<XrmQueryResult<EntityMeta>>;
    search(name: string, unique: boolean = false): Observable<XrmQueryResult<EntityMeta>> {
      let con = new Condition();
      if (!unique) {
        con
          .where("LogicalCollectionName", Comparator.ContainsData)
          .where("LogicalName", Comparator.ContainsData);
      } else {
        con.where("LogicalName", Comparator.Equals, name);
      }

      return this.xrmService.query(this.searchEntityMetaPrototype, con).pipe(map(_r => {
        let r = _r as XrmQueryResult<EntityMeta>;
          if (name != null && name != '') {
              let _s = name.toLowerCase();
              let ma = [];
              // Metadata api does not support contains - therefore client site filter
              r.value.forEach(e => {
                  if (e != null && e.LogicalName != null && e.LogicalName.toLowerCase().indexOf(_s) >= 0) {
                      ma.push(e);
                  }
              });
              r.value = ma;
          }

          r.value = r.value.sort((a, b) => a.LogicalName.toLowerCase().localeCompare(b.LogicalName.toLowerCase()))
          return _r;
      }));
    }

    get(id: string): Observable<EntityMeta> {
      return this.xrmService.get<EntityMeta>(this.getEntityMetaPrototype, id).pipe(map(_r => {
          let r = _r as EntityMeta;
          if (r.Attributes != null && r.Attributes.length > 0) {
              r.Attributes = r.Attributes.sort((a, b) => {
                  if (a.LogicalName == null && b.LogicalName != null) return 1;
                  if (a.LogicalName != null && b.LogicalName == null) return -1;
                  if (a.LogicalName == null && b.LogicalName == null) return 0;
                  return a.LogicalName.toLowerCase().localeCompare(b.LogicalName.toLowerCase())
              })
          }
          return r;
        }));
    }

    getManyToManyRelationships(entity: EntityMeta): Observable<EntityMeta> {
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        headers = headers.append("OData-MaxVersion", "4.0");
        headers = headers.append("OData-Version", "4.0");
        headers = headers.append("Content-Type", "application/json; charset=utf-8");
        headers = headers.append("Prefer", "odata.include-annotations=*");

        let options = {
            headers: headers
        }

        return this.http.get(this.xrmService.getServiceUrl() + 'EntityDefinitions(' + entity.id + ')' + '/ManyToManyRelationships?$select=MetadataId,Entity1LogicalName,Entity1NavigationPropertyName,Entity2LogicalName,Entity2NavigationPropertyName,SchemaName,RelationshipType', options)
          .pipe(map(response => {
              entity.ManyToManyRelations = response["value"] as ManyToManyRelationship[];

              entity.ManyToManyRelations.forEach(r => {
                  if (r.Entity1LogicalName == entity.LogicalName) {
                      r.Other = r.Entity2LogicalName;
                      r.OtherSchemaName = entity.SchemaName;
                      r.Entity1LogicalCollectionName = entity.LogicalCollectionName;
                  } else {
                      r.Other = r.Entity1LogicalName;
                      r.Entity2LogicalCollectionName = entity.LogicalCollectionName;
                  }
              });
              this.resolveRelationshipNames(entity.ManyToManyRelations);
            return entity;
          }));
    }

    resolveRelationshipNames(relations: ManyToManyRelationship[]): void {
        relations.forEach(r => {
            if (r.Entity1LogicalCollectionName == null) {
                this.search(r.Entity1LogicalName, true).subscribe(s => {
                    r.Entity1LogicalCollectionName = s.value[0].LogicalCollectionName;
                    if (r.Other == r.Entity1LogicalName) {
                        r.OtherSchemaName = s.value[0].SchemaName;
                    }
                });
            }

            if (r.Entity2LogicalCollectionName == null) {
                this.search(r.Entity2LogicalName, true).subscribe(s => {
                    r.Entity2LogicalCollectionName = s.value[0].LogicalCollectionName;
                    if (r.Other = r.Entity2LogicalName) {
                        r.OtherSchemaName = s.value[0].SchemaName;
                    }
                });
            }

        });
    }

    getOneToManyRelationships(entity: EntityMeta): Observable<EntityMeta> {
      let headers = new HttpHeaders({ 'Accept': 'application/json' });
      headers = headers.append("OData-MaxVersion", "4.0");
      headers = headers.append("OData-Version", "4.0");
      headers = headers.append("Content-Type", "application/json; charset=utf-8");
      headers = headers.append("Prefer", "odata.include-annotations=*");

      let options = {
        headers: headers
      }

      return this.http.get(this.xrmService.getServiceUrl() + 'EntityDefinitions(' + entity.id + ')' + '/OneToManyRelationships?$select=MetadataId,RelationshipType,SchemaName,ReferencedAttribute,ReferencingAttribute,ReferencedEntity,ReferencingEntity,ReferencingEntityNavigationPropertyName', options)
        .pipe(map(response => {
          entity.OneToManyRelations = response["value"] as OneToManyRelationship[];
          return entity;
        }));
    }

    getLookup(entity: EntityMeta, attr: AttributeMeta): Observable<EntityMeta> {
        if (attr.AttributeType == 'Lookup') {
            let headers = new HttpHeaders({ 'Accept': 'application/json' });
            headers = headers.append("OData-MaxVersion", "4.0");
            headers = headers.append("OData-Version", "4.0");
            headers = headers.append("Content-Type", "application/json; charset=utf-8");
            headers = headers.append("Prefer", "odata.include-annotations=*");

            let options = {
                headers: headers
            }

            return this.http.get<LookupAttribute>(this.xrmService.getServiceUrl() + 'EntityDefinitions(' + entity.id + ')/Attributes(' + attr.id + ')/Microsoft.Dynamics.CRM.LookupAttributeMetadata?$select=Targets,LogicalName,SchemaName')
              .pipe(map(response => {
                attr.Lookup = response as LookupAttribute;
                return entity;
            }));
        }

        if (attr.AttributeType == 'Customer') {
            attr.Lookup = {
                LogicalName: attr.LogicalName,
                SchemaName: attr.SchemaName,
                Targets: ['account','contact']
            }

            return new Observable<EntityMeta>(o => {
                o.next(entity);
            });
        }

        throw 'unknown Lookup type ' + attr.AttributeType;
    }
}
