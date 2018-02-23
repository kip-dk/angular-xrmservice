import { Component } from '@angular/core';

import { MetadataService, EntityMeta, AttributeMeta } from 'kipon-xrmservice';

class Support {
    get: boolean = true;
    query: boolean = true;
    update: boolean = true;
    create: boolean = true;
    delete: boolean = true;
    access: boolean = false;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
    constructor(private metadataService: MetadataService) { }

    entities: EntityMeta[];
    allEntities: EntityMeta[];
    current: EntityMeta;

    entitySearch: string;
    entitySearchThread: any;

    attrSearch: string;
    attrSearchThread: any;

    attributes: AttributeMeta[];

    code: string;

    support: Support = new Support();

    toggleSupport(attr: string) {
        this.support[attr] = !this.support[attr];
        this.renderCode();
    }

    ngOnInit() {
        this.updateEntities();
    }


    selectEntity(ent: EntityMeta) {
        let me = this;
        if (ent != this.current) {
            this.current = ent;
            this.renderCode();
            if (this.current.Attributes == null) {
                this.metadataService.get(this.current.id).subscribe(r => {
                    me.searchAttr(null);
                });
            } else {
                me.searchAttr(null);
            }

            if (this.current.OneToManyRelations == null) {
                this.metadataService.getOneToManyRelationships(this.current).subscribe(r => {
                    this.renderCode();
                });
            }
        }
    }

    searchEntity($event) {
        let me = this;
        if (this.entitySearchThread != null) {
            clearTimeout(this.entitySearchThread);
        }

        this.entitySearchThread = setTimeout(() => {
            this.entities = [];
            if (this.allEntities != null && this.allEntities.length > 0) {
                let _c = this.current;
                this.current = null;

                this.allEntities.forEach(r => {
                    if (me.entitySearch == null || me.entitySearch == '' || r.LogicalName == null || r.LogicalName.toLowerCase().indexOf(me.entitySearch.toLowerCase()) >= 0) {
                        this.entities.push(r);
                        if (_c == r) {
                            me.current = r;
                        }
                    }
                });
            }

        }, 800);
    }

    searchAttr($event) {
        let me = this;
        if (this.attrSearchThread != null) {
            clearTimeout(this.attrSearchThread);
        }

        this.attrSearchThread = setTimeout(() => {
            this.attributes = [];
            if (me.current != null && me.current.Attributes != null && me.current.Attributes.length > 0) {
                me.current.Attributes.forEach(r => {
                    let co = true;
                    if (r.AttributeType == 'Virtual') co = false;

                    if (r.LogicalName.endsWith('name')) {
                        let e = r.LogicalName.substring(0, r.LogicalName.length - 4);
                        let a = me.attributes.find(a => a.LogicalName == e);
                        if (a != null) {
                            co = false;
                        }
                    }

                    if (co) {
                        if (me.attrSearch == null || me.attrSearch == '' || r.LogicalName == null || r.LogicalName.toLowerCase().indexOf(me.attrSearch.toLowerCase()) >= 0) {
                            me.attributes.push(r);
                        }
                    }
                });
            }
        }, 800);
    }

    selectAttribute(att: AttributeMeta) {
        let me = this;
        att.selected = !att.selected;

        if (att.AttributeType == 'Lookup' || att.AttributeType == 'Customer') {
            if (att.Lookup == null) {
                this.metadataService.getLookup(this.current, att).subscribe(r => {
                    me.renderCode();
                });
            }
        }
        this.renderCode();
    }

    private updateEntities() {
        let me = this;
        this.metadataService.search(null).subscribe(r => {
            this.allEntities = r.value;
            this.searchEntity(null);
        });
    }

    renderCode(): void {
        let me = this;
        let acc = this.support.access ? ', XrmAccess': '';
        this.code = "import { Injectable } from '@angular/core';\n";
        this.code += "import { Observable } from 'rxjs/Observable';\n";
        this.code += "import { XrmQueryResult, XrmContextService, Entity, EntityReference, OptionSetValue, Condition, Operator, Comparator"+acc+" } from 'kipon-xrmservice';\n";
        this.code += "\n";
        if (this.current != null) {
            this.code += "export class " + this.current.SchemaName + " extends Entity {\n";
            this.code += "\tconstructor() {\n";
            this.code += "\t\tsuper('" + this.current.LogicalCollectionName + "','" + this.current.LogicalName + "id', " + (this.support.update ? "true" : "false") + ");\n";
            this.code += "\t}\n";

            if (this.current.Attributes != null) {
                this.current.Attributes.forEach(a => {
                    if (a['selected']) {
                        if (a.AttributeType == 'Uniqueidentifier' && me.current.LogicalName + 'id' == a.LogicalName) this.code += '\t// ';
                        this.code += "\t" + a.LogicalName + ":";

                        switch (a.AttributeType) {
                            case 'Uniqueidentifier': {
                                if (me.current.LogicalName + 'id' == a.LogicalName) {
                                    this.code += 'entity key column is always included, but name is converted to id';
                                } else {
                                    this.code += ' string = null;'
                                }
                                break;
                            }
                            case 'Memo': this.code += ' string = null;'; break;
                            case 'String': this.code += ' string = null;'; break;
                            case 'State': this.code += ' OptionSetValue = new OptionSetValue();'; break;
                            case 'Status': this.code += ' OptionSetValue = new OptionSetValue();'; break;
                            case 'Picklist': this.code += ' OptionSetValue = new OptionSetValue();'; break;
                            case 'DateTime': this.code += ' Date = new Date();'; break;
                            case 'Owner': {
                                this.code += ' EntityReference = new EntityReference().meta("systemusers","ownerid");';
                                break;
                            }
                            case 'Customer':
                            case 'Lookup': {
                                if (a.Lookup == null) {
                                    this.code += '** pending **';
                                } else {
                                    let _plural: string = null;

                                    let re = me.allEntities.find(r => r.LogicalName == a.Lookup.Targets[0]);
                                    if (re.OneToManyRelations == null) {
                                        this.code += '** pending **';
                                        me.metadataService.getOneToManyRelationships(re).subscribe(r => me.renderCode() );
                                    } else {
                                        let ref = re.OneToManyRelations.find(r => r.ReferencingAttribute == a.LogicalName && r.ReferencingEntity == me.current.LogicalName && r.ReferencedEntity == a.Lookup.Targets[0]);
                                        this.code += ' EntityReference = new EntityReference().meta("' + re.LogicalCollectionName + '","' + ref.ReferencingEntityNavigationPropertyName + '");';
                                    }
                                }
                                break;
                            }
                            case 'Double': this.code += ' number = null;'; break;
                            case 'Decimal': this.code += ' number = null;'; break;
                            case 'Money':  this.code += ' number = null;'; break;
                            case 'Integer': this.code += ' number = null;'; break;
                            case 'Boolean': this.code += ' boolean = null;'; break;
                            default: this.code += '?? ' + a.AttributeType + ' ??;'; break;
                        }

                        this.code += '\n';
                    }
                });

                if (this.support.access) {
                    this.code += "\taccess:XrmAccess = new XrmAccess(true);\t";
                }

                this.code += "\n";
                this.code += "\tmeta():" +  this.current.SchemaName + " {\n";

                this.current.Attributes.forEach(a => {
                    if (a['selected']) {
                        switch (a.AttributeType) {
                            case 'Double':
                            case 'Decimal':
                            case 'Money': this.code += '\t\tthis.' + a.LogicalName + ' = 0.0000000001;\n'; break;
                        }
                    }
                });
                this.code += "\t\t return this;\n"
                this.code += "\t}\n"
            }
            this.code += "}\n"

            this.code += "\n";
            this.code += "@Injectable()\n";
            this.code += "export class " + this.current.SchemaName + "Service {\n";
            this.code += "\tlocalPrototype: " + this.current.SchemaName + " = new " + this.current.SchemaName + "().meta();\n";
            this.code += "\tconstructor(private xrmService: XrmContextService) { }\n";

            if (this.support.get) {
                this.code += "\n";
                this.code += "\tget(id:string): Observable<" + this.current.SchemaName + "> {\n";
                this.code += "\t\treturn this.xrmService.get<" + this.current.SchemaName + ">(this.localPrototype, id);\n";
                this.code += "\t}\n";
            }

            if (this.support.query) {
                this.code += "\n";
                this.code += "\tquery(search:string): Observable<XrmQueryResult<" + this.current.SchemaName + ">> {\n";
                this.code += "\t\tlet condition: Condition = new Condition().where('<search field>', Comparator.Contains, search);\n";
                this.code += "\t\treturn this.xrmService.query<" + this.current.SchemaName + ">(this.localPrototype, condition);\n";
                this.code += "\t}\n";
            }

            if (this.support.create) {
                this.code += "\n";
                this.code += "\tcreate(instance: " + this.current.SchemaName + "): Observable<" + this.current.SchemaName + "> {\n";
                this.code += "\t\treturn this.xrmService.create<" + this.current.SchemaName + ">(this.localPrototype, instance);\n";
                this.code += "\t}\n";
            }

            if (this.support.update) {
                this.code += "\n";
                this.code += "\tupdate(instance: " + this.current.SchemaName + "): Observable<" + this.current.SchemaName + "> {\n";
                this.code += "\t\treturn this.xrmService.update<" + this.current.SchemaName + ">(this.localPrototype, instance);\n";
                this.code += "\t}\n";
            }

            if (this.support.delete) {
                this.code += "\n";
                this.code += "\tdelete(instance: " + this.current.SchemaName + "): Observable<null> {\n";
                this.code += "\t\treturn this.xrmService.delete(instance);\n";
                this.code += "\t}\n";
            }

            this.code += "}\n";
        }
    }
}
