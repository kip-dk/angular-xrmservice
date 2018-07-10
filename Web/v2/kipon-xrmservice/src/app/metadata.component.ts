import { Component } from '@angular/core';

import { MetadataService, EntityMeta } from 'kipon-xrmservice';



@Component({
  selector: 'metadata',
  templateUrl: './metadata.component.html'
})
export class MetadataComponent {

  oppMeta: EntityMeta;
  constructor(private metadataService: MetadataService) {
  }

  ngOnInit() {
    console.log('init metadata component');
    this.metadataService.search("opportunity", true).subscribe(r => {
      this.oppMeta = r.value[0];
      this.metadataService.getManyToManyRelationships(this.oppMeta).subscribe(r => {
        console.log(r);
      });
    });
  }
}
