import { Component } from '@angular/core';

import { MetadataService, EntityMeta } from 'kipon-xrmservice';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
    constructor(private metadataService: MetadataService) { }

    entities: EntityMeta[];
    current: EntityMeta;

    entitySearch: string;
    entitySearchThread: any;

    ngOnInit() {
        this.updateEntities();
    }


    selectEntity(ent: EntityMeta) {
        if (ent != this.current) {
            this.current = ent;
        }
    }

    searchEntity($event) {
        let me = this;
        if (this.entitySearchThread != null) {
            clearTimeout(this.entitySearchThread);
        }

        this.entitySearchThread = setTimeout(() => {
            me.updateEntities();
        }, 800);
    }

    private updateEntities() {
        let me = this;
        this.metadataService.search(this.entitySearch).subscribe(r => {
            this.entities = r.value;
        });
    }
}
