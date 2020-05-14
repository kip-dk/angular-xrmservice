import { Component } from '@angular/core';

import { XrmMetadataService, EntityMeta, XrmContextService } from 'kipon-xrmservice';



@Component({
  selector: 'metadata',
  templateUrl: './metadata.component.html'
})
export class MetadataComponent {

  oppMeta: EntityMeta;
  constructor(private metadataService: XrmMetadataService, private xrmService: XrmContextService) {
  }

  ngOnInit() {
    this.metadataService.search("opportunity", true).subscribe(r => {
      this.oppMeta = r.value[0];
      this.metadataService.getManyToManyRelationships(this.oppMeta).toPromise().then(r => {
      });
    });
  }
}
