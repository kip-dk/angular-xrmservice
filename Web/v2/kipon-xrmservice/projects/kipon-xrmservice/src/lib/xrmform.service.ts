import { Injectable } from '@angular/core';

const KiponXrmLOCAL_getFormType = "KiponXrmServiceLOCAL_getFormType";
const KiponXrmLOCAL_formentityr = "KiponXrmServiceLOCAL_formentityr";
const KiponXrmLOCAL_context = "KiponXrmServiceLOCAL_context";

export interface XrmContext {
  getClientUrl(): string;
  getQueryStringParameters(): any;
  getVersion(): string;
  getUserName(): string;
  getUserId(): string;
  $devClientUrl(): string;
}


export class XrmFormKey {
  id: string;
  type: string;
}

export class XrmContextInstance implements XrmContext {
  private clientUrl: string;
  private queryStringParameters: string;
  private version: string;
  private userName: string;
  private userId: string;
  private apiurl: string = '/api/data/v9.0/';

  constructor(ctx: XrmContext) {
    this.clientUrl = ctx.getClientUrl();
    this.getQueryStringParameters = ctx.getQueryStringParameters();
    this.version = ctx.getVersion();
    this.userName = ctx.getUserName();
    this.userId = ctx.getUserId();
  } 

  getClientUrl(): string {
    return this.clientUrl;
  }

  getQueryStringParameters(): any {
    return this.queryStringParameters;
  }

  getVersion(): string {
    return this.version;
  }

  getUserName(): string {
    return this.userName;
  }

  getUserId(): string {
    return this.userId;
  }
  $devClientUrl(): string {
    return this.clientUrl + this.apiurl;;
  }
}

@Injectable()
export class XrmFormService {
  constructor() { }

  getContext(): XrmContext {
    if (window[KiponXrmLOCAL_context]) {
      return window[KiponXrmLOCAL_context];
    }

    if (typeof window["GetGlobalContext"] != "undefined") {
      window[KiponXrmLOCAL_context] =  new XrmContextInstance(window["GetGlobalContext"]());
      return window[KiponXrmLOCAL_context];
    }

    if (window.parent && window.parent[KiponXrmLOCAL_context]) {
      window[KiponXrmLOCAL_context] = new XrmContextInstance(window.parent[KiponXrmLOCAL_context]);
      return window[KiponXrmLOCAL_context];
    }

    if (window.opener && window.opener[KiponXrmLOCAL_context]) {
      window[KiponXrmLOCAL_context] = new XrmContextInstance(window.opener[KiponXrmLOCAL_context]);
      return window[KiponXrmLOCAL_context];
    }

    if (window["Xrm"] && window["Xrm"]["Page"] && window["Xrm"]["Page"]["context"]) {
      window[KiponXrmLOCAL_context] = new XrmContextInstance(window["Xrm"]["Page"]["context"]);
      return window[KiponXrmLOCAL_context];
    }

    if (window.parent && window.parent["Xrm"] && window.parent["Xrm"]["Page"] && window.parent["Xrm"]["Page"]["context"]) {
      window[KiponXrmLOCAL_context] = new XrmContextInstance(window.parent["Xrm"]["Page"]["context"]);
      return window[KiponXrmLOCAL_context];
    }

    if (window.opener && window.opener["Xrm"] && window.opener["Xrm"]["Page"] && window.opener["Xrm"]["Page"]["context"]) {
      window[KiponXrmLOCAL_context] = new XrmContextInstance(window.opener["Xrm"]["Page"]["context"]);
      return window[KiponXrmLOCAL_context];
    }
    return null;
  }

  // "Xrm", "Page", "ui", "getFormType"
  getFormType(): number {
    if (window[KiponXrmLOCAL_getFormType]) {
      return window[KiponXrmLOCAL_getFormType];
    }

    if (window.parent && window.parent[KiponXrmLOCAL_getFormType]) {
      window[KiponXrmLOCAL_getFormType] = window.parent[KiponXrmLOCAL_getFormType];
      return window[KiponXrmLOCAL_getFormType];
    }

    if (window.opener && window.opener[KiponXrmLOCAL_getFormType]) {
      window[KiponXrmLOCAL_getFormType] = window.opener[KiponXrmLOCAL_getFormType];
      return window[KiponXrmLOCAL_getFormType];
    }

    if (window["Xrm"] && window["Xrm"]["Page"] && window["Xrm"]["Page"]["ui"] && window["Xrm"]["Page"]["ui"]["getFormType"]) {
      window[KiponXrmLOCAL_getFormType] = window["Xrm"]["Page"]["ui"]["getFormType"]();
      return window[KiponXrmLOCAL_getFormType];
    }

    if (window.parent && window.parent["Xrm"] && window.parent["Xrm"]["Page"] && window.parent["Xrm"]["Page"]["ui"] && window.parent["Xrm"]["Page"]["ui"]["getFormType"]) {
      window[KiponXrmLOCAL_getFormType] = window.parent["Xrm"]["Page"]["ui"]["getFormType"]();
      return window[KiponXrmLOCAL_getFormType];
    }

    if (window.opener && window.opener["Xrm"] && window.opener["Xrm"]["Page"] && window.opener["Xrm"]["Page"]["ui"] && window.opener["Xrm"]["Page"]["ui"]["getFormType"]) {
      window[KiponXrmLOCAL_getFormType] = window.opener["Xrm"]["Page"]["ui"]["getFormType"]();
      return window[KiponXrmLOCAL_getFormType];
    }
    return null;
  }

  // "Xrm", "Page", "data", "entity"
  getFormKey(id: string, type: string): XrmFormKey {
    if (typeof id != 'undefined' && id != null && id != '' && typeof type != 'undefined' && type != null && type != '') {
      let result = new XrmFormKey();
      result.id = id;
      result.type = type;
      window[KiponXrmLOCAL_formentityr] = result;
      return result;
    }

    if (window[KiponXrmLOCAL_formentityr]) {
      return window[KiponXrmLOCAL_formentityr];
    }


    if (window.parent && window.parent[KiponXrmLOCAL_formentityr]) {
      window[KiponXrmLOCAL_formentityr] = window.parent[KiponXrmLOCAL_formentityr];
      return window[KiponXrmLOCAL_formentityr];
    }

    if (window.opener && window.opener[KiponXrmLOCAL_formentityr]) {
      window[KiponXrmLOCAL_formentityr] = window.opener[KiponXrmLOCAL_formentityr];
      return window[KiponXrmLOCAL_formentityr];
    }

    if (window["Xrm"] && window["Xrm"]["Page"] && window["Xrm"]["Page"]["data"] && window["Xrm"]["Page"]["data"]["entity"]) {
      var result = new XrmFormKey();
      result.id = window["Xrm"]["Page"]["data"]["entity"]["getId"]();
      result.type = window["Xrm"]["Page"]["data"]["entity"]["getEntityName"]();
      window[KiponXrmLOCAL_formentityr] = result;
      return window[KiponXrmLOCAL_formentityr];
    }

    if (window.parent && window.parent["Xrm"] && window.parent["Xrm"]["Page"] && window.parent["Xrm"]["Page"]["data"] && window.parent["Xrm"]["Page"]["data"]["entity"]) {
      var result = new XrmFormKey();
      result.id = window.parent["Xrm"]["Page"]["data"]["entity"]["getId"]();
      result.type = window.parent["Xrm"]["Page"]["data"]["entity"]["getEntityName"]();
      window[KiponXrmLOCAL_formentityr] = result;
      return window[KiponXrmLOCAL_formentityr];
    }

    if (window.opener && window.opener["Xrm"] && window.opener["Xrm"]["Page"] && window.opener["Xrm"]["Page"]["data"] && window.opener["Xrm"]["Page"]["data"]["entity"]) {
      var result = new XrmFormKey();
      result.id = window.opener["Xrm"]["Page"]["data"]["entity"]["getId"]();
      result.type = window.opener["Xrm"]["Page"]["data"]["entity"]["getEntityName"]();

      window[KiponXrmLOCAL_formentityr] = result;
      return window[KiponXrmLOCAL_formentityr];
    }
    return null;
  }
}
