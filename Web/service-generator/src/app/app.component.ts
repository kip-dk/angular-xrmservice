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

    ngOnInit() {
        this.updateEntities();
    }

    private updateEntities() {
        let me = this;
        this.metadataService.search(null).subscribe(r => {
            this.entities = r.value;
        });
    }
}
