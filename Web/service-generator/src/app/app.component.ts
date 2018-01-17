import { Component } from '@angular/core';

import { MetadataService, EntityMeta, AttributeMeta } from 'kipon-xrmservice';

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

    ngOnInit() {
        this.updateEntities();
    }


    selectEntity(ent: EntityMeta) {
        let me = this;
        if (ent != this.current) {
            this.current = ent;
            if (this.current.Attributes == null) {
                this.metadataService.get(this.current.id).subscribe(r => {
                    me.searchAttr(null);
                });
            } else {
                me.searchAttr(null);
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
                    if (me.attrSearch == null || me.attrSearch == '' || r.LogicalName == null || r.LogicalName.toLowerCase().indexOf(me.attrSearch.toLowerCase()) >= 0) {
                        me.attributes.push(r);
                    }
                });
            }
        }, 800);
    }

    selectAttribute(att: AttributeMeta) {
        att['selected'] = !att['selected'];
    }

    private updateEntities() {
        let me = this;
        this.metadataService.search(null).subscribe(r => {
            this.allEntities = r.value;
            this.searchEntity(null);
        });
    }
}
