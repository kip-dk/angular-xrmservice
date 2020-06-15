import { Entity, Condition } from "./xrmcontext.service";


export class FetchEntity {
  name: string;
  entityPrototype: Entity;
  attributes: string[];
  condition: Condition;
  linkedentities: Link[];
  parent: FetchEntity;

  link(prototype: Entity, property: string, condition: Condition): FetchEntity;
  link(prototype: Entity, property: string, condition: Condition, attributes: string[]): FetchEntity;
  link(prototype: Entity, property: string, condition: Condition, attributes: string[] = null): FetchEntity {
    var res = new FetchEntity();
    res.entityPrototype = prototype;
    res.name = prototype._logicalName;
    res.condition = condition;
    res.attributes = attributes
    res.parent = res;

    if (this.linkedentities == null) {
      this.linkedentities = [];
    }
    var next = new Link();
    next.entity = res;
    next.to = property;
    next.alias = property;
    this.linkedentities.push(next);
    return res;
  }

  innerjoin(prototype: Entity, alias: string, from: string, property: string, condition: Condition): FetchEntity;
  innerjoin(prototype: Entity, alias: string, from: string, property: string, condition: Condition, attributes: string[]): FetchEntity;
  innerjoin(prototype: Entity, alias: string, from: string, property: string, condition: Condition, attributes: string[] = null): FetchEntity {
    var res = new FetchEntity();
    res.entityPrototype = prototype;
    res.name = prototype._logicalName;
    res.condition = condition;
    res.attributes = attributes
    res.parent = res;

    if (this.linkedentities == null) {
      this.linkedentities = [];
    }
    var next = new Link();
    next.entity = res;
    next.to = property;
    next.alias = alias;
    next.from = from;
    next.type = "inner";

    this.linkedentities.push(next);
    return res;
  }

  outerjoin(prototype: Entity, alias: string, from: string, property: string, condition: Condition): FetchEntity;
  outerjoin(prototype: Entity, alias: string, from: string, property: string, condition: Condition, attributes: string[]): FetchEntity;
  outerjoin(prototype: Entity, alias: string, from: string, property: string, condition: Condition, attributes: string[] = null): FetchEntity {
    var res = new FetchEntity();
    res.entityPrototype = prototype;
    res.name = prototype._logicalName;
    res.condition = condition;
    res.attributes = attributes
    res.parent = res;

    if (this.linkedentities == null) {
      this.linkedentities = [];
    }
    var next = new Link();
    next.entity = res;
    next.to = property;
    next.alias = alias;
    next.from = from;
    next.type = "outer";

    this.linkedentities.push(next);
    return res;
  }

  aliasWithAttributes(): string[] {
    var result = [];
    this.resolveAlias(this.linkedentities, result);
    return result;
  }

  private resolveAlias(links: Link[], result: string[]): void {
    if (links != null && links.length > 0) {
      links.forEach(l => {
        if (l.entity.attributes != null && l.entity.attributes.length > 0) {
          result.push(l.alias);
        }
        this.resolveAlias(l.entity.linkedentities, result);
      });
    }
  }
}

export class Link {
  from: string;
  alias: string;
  type: string;
  to: string;

  entity: FetchEntity;

  toFetchXml(populateAttrib: boolean): string {
    var result: string = "";

    var fromString = "";
    if (this.from != null) {
      fromString = " alias='" + this.alias + "' from='" + this.from + "' link-type='" + this.type + "'";
    }

    if (this.from == null && this.alias != null && this.alias != '') {
      fromString = " alias='" + this.alias + "'";
    }

    result += "<link-entity name='" + this.entity.name + "' to='" + this.to + "'" + fromString + ">";

    if (populateAttrib) {
      if (this.entity.attributes != null && this.entity.attributes.length > 0) {
        this.entity.attributes.forEach(a => {
          result += "<attribute name='" + a + "'/>"
        });
      }
    }

    if (this.entity.condition != null) {
      result += this.entity.condition.toFetchXml();
    }

    if (this.entity.linkedentities != null && this.entity.linkedentities.length > 0) {
      this.entity.linkedentities.forEach(l => {
        result += l.toFetchXml(populateAttrib);
      });
    }
    result += "</link-entity>";
    return result;
  }
}

class Fetchsort {
  attribute: string;
  descending: boolean;

  toFetchXml(): string {
    if (this.descending) {
      return "<order attribute='" + this.attribute + "' descending='true' />";
    }
    return "<order attribute='" + this.attribute + "' />";
  }
}

export class Fetchxml {
  private root: FetchEntity;
  private keyname: string;

  count: number;
  page: number;
  distinct: boolean;
  private sorts: Fetchsort[];

  constructor(prototype: Entity, condition: Condition) {
    this.root = new FetchEntity();
    this.root.entityPrototype = prototype;
    this.keyname = prototype._keyName;
    this.root.name = prototype._logicalName;
    this.root.condition = condition;
    this.root.attributes = prototype.columns(false);
  }

  entity(): FetchEntity {
    return this.root;
  }

  sort(attribname: string): void;
  sort(attribname: string, descending: boolean): void;
  sort(attribname: string, descending: boolean = false): void {
    if (this.sorts == null) {
      this.sorts = [] as Fetchsort[];
    }
    let nextsort = new Fetchsort();
    nextsort.attribute = attribname;
    nextsort.descending = descending;
    this.sorts.push(nextsort);
  }


  toCountFetchXml(): string {
    let result: string = "";

    var distinct = "";
    if (this.distinct != null) {
      distinct = " distinct='" + this.distinct + "'"
    }

    var aggr = "count";

    var dist = '';
    if (this.distinct) {
      dist = " distinct='true'";
      aggr = "countcolumn"
    }


    result += "<fetch mapping='logical'" + distinct + " aggregate='true'>"
    result += "<entity name='" + this.root.name + "'>";
    result += "<attribute name='" + this.keyname + "' aggregate='"+aggr+"' alias='count'"+dist+"  />";

    if (this.root.condition != null) {
      result += this.root.condition.toFetchXml();
    }

    if (this.root.linkedentities != null && this.root.linkedentities.length > 0) {
      this.root.linkedentities.forEach(l => {
        result += l.toFetchXml(false);
      })
    }

    result += "</entity>";
    result += "</fetch>";

    return result;
  }

  toFetchXml(): string;
  toFetchXml(pageCoocie: string, forPage: number): string;
  toFetchXml(pageCoocie: string = null, forPage: number = null): string {
    let result: string = "";

    var page = "";
    if (this.count != null) {
      if (this.page == null) {
        this.page = 1;
      }

      if (forPage == null) {
        forPage = this.page;
      }

      page = " count='" + this.count + "' page='" + forPage + "'";
    }

    if (pageCoocie != null) {
      page += " paging-cookie='" + pageCoocie + "'";
    } else {
      page += " paging-cookie=''";
    }

    var distinct = "";
    if (this.distinct != null) {
      distinct = " distinct='" + this.distinct + "'"
    }

    result += "<fetch mapping='logical'" + page + distinct + ">"
    result += "<entity name='" + this.root.name + "'>";
    result += "<attribute name='" + this.keyname + "' />"
    this.root.attributes.forEach(a => {
      result += "<attribute name='"+a+"'/>"
    });

    if (this.root.condition != null) {
      result += this.root.condition.toFetchXml();
    }

    if (this.root.linkedentities != null && this.root.linkedentities.length > 0) {
      this.root.linkedentities.forEach(l => {
        result += l.toFetchXml(true);
      })
    }

    if (this.sorts != null && this.sorts.length > 0) {
      this.sorts.forEach(s => {
        result += s.toFetchXml();
      });
    }

    result += "</entity>";
    result += "</fetch>"
    return result;
  }
}
