import { Entity, Condition } from "./xrmcontext.service";


export class FetchEntity {
  name: string;
  attributes: string[];
  condition: Condition;
  linkedentities: Link[];
  parent: FetchEntity;

  link(prototype: Entity, property: string, condition: Condition): FetchEntity;
  link(prototype: Entity, property: string, condition: Condition, attributes: string[]): FetchEntity;
  link(prototype: Entity, property: string, condition: Condition, attributes: string[] = null): FetchEntity {
    var res = new FetchEntity();
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
    this.linkedentities.push(next);
    return res;
  }
}

export class Link {
  to: string;
  entity: FetchEntity;

  toFetchXml(): string {
    var result: string = "";
    result += "<link-entity name='" + this.entity.name + "' to='" + this.to + "'>";
    if (this.entity.attributes != null && this.entity.attributes.length > 0) {
      this.entity.attributes.forEach(a => {
        result += "<attribute name='" + a + "'/>"
      });
    }

    if (this.entity.condition != null) {
      result += this.entity.condition.toFetchXml();
    }

    if (this.entity.linkedentities != null && this.entity.linkedentities.length > 0) {
      this.entity.linkedentities.forEach(l => {
        result += l.toFetchXml();
      });
    }
    result += "</link-entity>";
    return result;
  }
}

export class Fetchxml {
  private root: FetchEntity;

  count: number;
  page: number;
  distinct: boolean;

  constructor(prototype: Entity, condition: Condition) {
    this.root = new FetchEntity();
    this.root.name = prototype._logicalName;
    this.root.condition = condition;
    this.root.attributes = prototype.columns(false);
  }

  entity(): FetchEntity {
    return this.root;
  }

  toFetchXml(): string {
    let result: string = "";

    var page = "";
    if (this.count != null) {
      if (this.page == null) {
        this.page = 1;
      }
      page = " count='"+this.count+"' page='"+this.page+"' paging-cookie=''";
    }

    var distinct = "";
    if (this.distinct != null) {
      distinct = " distinct='" + this.distinct + "'"
    }

    result += "<fetch mapping='logical'" + page + distinct + ">"
    result += "<entity name='" + this.root.name + "'>"
    this.root.attributes.forEach(a => {
      result += "<attribute name='"+a+"'/>"
    });

    if (this.root.condition != null) {
      result += this.root.condition.toFetchXml();
    }

    if (this.root.linkedentities != null && this.root.linkedentities.length > 0) {
      this.root.linkedentities.forEach(l => {
        result += l.toFetchXml();
      })
    }
    result += "</entity>";
    result += "</fetch>"
    return result;
  }
}
