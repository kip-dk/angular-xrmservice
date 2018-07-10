import { Component, Input } from '@angular/core';
import { Entity, XrmAccess } from 'kipon-xrmservice';


@Component({
    selector: 'access-view',
    templateUrl: './accessView.component.html'
})
export class AccessViewComponent {

    @Input() entity: Entity;
    access: XrmAccess;

    ngOnChanges(changes) {
        if (this.entity != null && this.entity.hasOwnProperty('access')) {
            this.access = this.entity['access'] as XrmAccess;
        } else {
            this.access = null;
        }
    }
}
