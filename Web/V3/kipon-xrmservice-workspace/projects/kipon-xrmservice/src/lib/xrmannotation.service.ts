import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { XrmQueryResult } from './xrm.service'
import { Entity, EntityReference, OptionSetValue, Entities, XrmContextService, Condition, Comparator } from './xrmcontext.service';

export class Annotation extends Entity {
  constructor() {
    super('annotations', 'annotationid', true);
  }
  // 	annotationid:entity key column is always included, but name is converted to id
  filename: string = null;
  filesize: number = null;
  isdocument: boolean = null;
  notetext: string = null;
  objectid: EntityReference = new EntityReference().meta("accounts", "objectid_account");
  objectidtypecode: string;
  ownerid: EntityReference = new EntityReference().meta("systemusers", "ownerid");
  subject: string = null;

  meta(): Annotation {
    return this;
  }
}

@Injectable()
export class XrmAnnotationService {
  localPrototype: Annotation = new Annotation().meta();
  constructor(private xrmService: XrmContextService) { }

  get(id: string): Observable<Annotation> {
    return this.xrmService.get<Annotation>(this.localPrototype, id);
  }

  related(entity: Entity): Observable<XrmQueryResult<Annotation>> {
    let condition: Condition = new Condition()
      .where('objectid', Comparator.Equals, entity.id)
      .where('objecttypecode', Comparator.Equals, entity._logicalName);
    return this.xrmService.query<Annotation>(this.localPrototype, condition);
  }

  add(entity: Entity, subject: string, body: string): Observable<Annotation> {
    var anno = new Annotation();
    anno.isdocument = false;
    anno.subject = subject;
    anno.notetext = body;
    anno.objectid = new EntityReference().meta(entity._pluralName, "objectid_" + entity._logicalName);
    anno.objectid.id = entity.id;
    return this.xrmService.create<Annotation>(this.localPrototype, anno);
  }

  update(anno: Annotation): Observable<Annotation> {
    return this.xrmService.update(this.localPrototype, anno);
  }

  delete(anno: Annotation): Observable<null> {
    return this.xrmService.delete(anno);
  }
}
