import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { mergeMap } from 'rxjs/operators';

import { Entity, EntityReference, OptionSetValue, Entities, XrmContextService } from './xrmcontext.service';

export class Role extends Entity {
  constructor() {
    super('roles', 'roleid', true);
  }
  businessunitid: EntityReference = new EntityReference().meta("businessunits", "businessunitid");
  name: string = null;
  parentroleid: EntityReference = new EntityReference().meta("roles", "parentroleid");
  parentrootroleid: EntityReference = new EntityReference().meta("roles", "parentrootroleid");

  meta(): Role {
    return this;
  }
}

export class Team extends Entity {
  constructor() {
    super('teams', 'teamid', true);
  }
  description: string = null;
  emailaddress: string = null;
  name: string = null;
  teamtype: OptionSetValue = new OptionSetValue();

  meta(): Team {
    return this;
  }
}

export class SystemUser extends Entity {
  constructor() {
    super('systemusers', 'systemuserid', true);
  }
  address1_name: string = null;
  address2_name: string = null;
  domainname: string = null;
  firstname: string = null;
  fullname: string = null;
  lastname: string = null;
  middlename: string = null;
  nickname: string = null;
  systemuserroles_association: Entities<Role>;
  teammembership_association: Entities<Team>;

  hasRole(name: string): boolean {
    if (this.systemuserroles_association != null && this.systemuserroles_association.length > 0) {
      for (var i = 0; i < this.systemuserroles_association.length; i++) {
        if (this.systemuserroles_association[i].name == name) {
          return true;
        }
      }
    }
    return false;
  }

  memberOf(name: string): boolean {
    if (this.teammembership_association != null && this.teammembership_association.length > 0) {
      for (var i = 0; i < this.teammembership_association.length; i++) {
        if (name == this.teammembership_association[i].name) {
          return true;
        }
      }
    }
    return false;
  }

  roles: Role[];
  teams: Team[];

  onFetch() {
    this.roles = [];
    if (this.systemuserroles_association != null) {
      this.systemuserroles_association.forEach(r => {
        this.roles.push(r);
      })
    }
    this.teams = [];
    if (this.teammembership_association != null) {
      this.teammembership_association.forEach(t => {
        this.teams.push(t);
      });
    }
  }

  meta(): SystemUser {
    this.systemuserroles_association = new Entities<Role>('systemusers', 'roles', 'systemuserroles_association', true, new Role().meta());
    this.teammembership_association = new Entities<Team>('systemusers', 'teams', 'teammembership_association', false, new Team().meta());
    return this;
  }
}


@Injectable()
export class XrmSecurityService {
  private rolePrototype: Role = new Role().meta();
  private teamPrototype: Team = new Team().meta();
  private userPrototype: SystemUser = new SystemUser().meta();
  constructor(private xrmService: XrmContextService) { }

  getUser(id: string): Observable<SystemUser> {
    return this.xrmService.get<SystemUser>(this.userPrototype, id);
  }

  getCurrentUser(): Observable<SystemUser> {
    return this.xrmService.getCurrentUserId().pipe(mergeMap(u => {
      return this.getUser(u);
    }));
  }
}
