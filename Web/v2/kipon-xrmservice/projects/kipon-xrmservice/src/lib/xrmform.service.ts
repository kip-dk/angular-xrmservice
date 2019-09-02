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

@Injectable()
export class XrmFormService {
  constructor() { }

  getContext(): XrmContext {
    if (window[KiponXrmLOCAL_context]) {
      return window[KiponXrmLOCAL_context]();
    }

    if (typeof window["GetGlobalContext"] != "undefined") {
      window[KiponXrmLOCAL_context] = function () {
        return window["GetGlobalContext"]();
      }
      return this.getContext();
    }

    if (window.parent && window.parent[KiponXrmLOCAL_context]) {
      window[KiponXrmLOCAL_context] = function () {
        return window.parent[KiponXrmLOCAL_context]();
      }
      return this.getContext();
    }

    if (window.opener && window.opener[KiponXrmLOCAL_context]) {
      window[KiponXrmLOCAL_context] = function () {
        return window.opener[KiponXrmLOCAL_context]();
      }
      return this.getContext();
    }

    if (window["Xrm"] && window["Xrm"]["Page"] && window["Xrm"]["Page"]["context"]) {
      window[KiponXrmLOCAL_context] = function () {
        return window["Xrm"]["Page"]["context"];
      }
      return this.getContext();
    }

    if (window.parent && window.parent["Xrm"] && window.parent["Xrm"]["Page"] && window.parent["Xrm"]["Page"]["context"]) {
      window[KiponXrmLOCAL_context] = function () {
        return window.parent["Xrm"]["Page"]["context"];
      }
      return this.getContext();
    }

    if (window.opener && window.opener["Xrm"] && window.opener["Xrm"]["Page"] && window.opener["Xrm"]["Page"]["context"]) {
      window[KiponXrmLOCAL_context] = function () {
        return window.opener["Xrm"]["Page"]["context"];
      }
      return this.getContext();
    }
    return null;
  }

  // "Xrm", "Page", "ui", "getFormType"
  getFormType(): number {
    if (window[KiponXrmLOCAL_getFormType]) {
      return window[KiponXrmLOCAL_getFormType]();
    }

    if (window.parent && window.parent[KiponXrmLOCAL_getFormType]) {
      window[KiponXrmLOCAL_getFormType] = function () {
        return window.parent[KiponXrmLOCAL_getFormType]();
      }
      return this.getFormType();
    }

    if (window.opener && window.opener[KiponXrmLOCAL_getFormType]) {
      window[KiponXrmLOCAL_getFormType] = function () {
        return window.opener[KiponXrmLOCAL_getFormType]();
      }
      return this.getFormType();
    }

    if (window["Xrm"] && window["Xrm"]["Page"] && window["Xrm"]["Page"]["ui"] && window["Xrm"]["Page"]["ui"]["getFormType"]) {
      window[KiponXrmLOCAL_getFormType] = function () {
        return window["Xrm"]["Page"]["ui"]["getFormType"]();
      }
      return this.getFormType();
    }

    if (window.parent && window.parent["Xrm"] && window.parent["Xrm"]["Page"] && window.parent["Xrm"]["Page"]["ui"] && window.parent["Xrm"]["Page"]["ui"]["getFormType"]) {
      window[KiponXrmLOCAL_getFormType] = function () {
        return window.parent["Xrm"]["Page"]["ui"]["getFormType"]();
      }
      return this.getFormType();
    }

    if (window.opener && window.opener["Xrm"] && window.opener["Xrm"]["Page"] && window.opener["Xrm"]["Page"]["ui"] && window.opener["Xrm"]["Page"]["ui"]["getFormType"]) {
      window[KiponXrmLOCAL_getFormType] = function () {
        return window.opener["Xrm"]["Page"]["ui"]["getFormType"]();
      }
      return this.getFormType();
    }
    return null;
  }

  // "Xrm", "Page", "data", "entity"
  getFormKey(): XrmFormKey {
    if (window[KiponXrmLOCAL_formentityr]) {
      return window[KiponXrmLOCAL_formentityr]();
    }

    if (window.parent && window.parent[KiponXrmLOCAL_formentityr]) {
      window[KiponXrmLOCAL_formentityr] = function () {
        return window.parent[KiponXrmLOCAL_formentityr]();
      }
      return this.getFormKey();
    }

    if (window.opener && window.opener[KiponXrmLOCAL_formentityr]) {
      window[KiponXrmLOCAL_formentityr] = function () {
        return window.opener[KiponXrmLOCAL_formentityr]();
      }
      return this.getFormKey();
    }

    if (window["Xrm"] && window["Xrm"]["Page"] && window["Xrm"]["Page"]["data"] && window["Xrm"]["Page"]["data"]["entity"]) {
      window[KiponXrmLOCAL_formentityr] = function () {
        var result = new XrmFormKey();
        result.id = window["Xrm"]["Page"]["data"]["entity"]["getId"]();
        result.type = window["Xrm"]["Page"]["data"]["entity"]["getEntityName"]();
        return result;
      }
      return this.getFormKey();
    }

    if (window.parent && window.parent["Xrm"] && window.parent["Xrm"]["Page"] && window.parent["Xrm"]["Page"]["data"] && window.parent["Xrm"]["Page"]["data"]["entity"]) {
      window[KiponXrmLOCAL_formentityr] = function () {
        var result = new XrmFormKey();
        result.id = window.parent["Xrm"]["Page"]["data"]["entity"]["getId"]();
        result.type = window.parent["Xrm"]["Page"]["data"]["entity"]["getEntityName"]();
        return result;
      }
      return this.getFormKey();
    }

    if (window.opener && window.opener["Xrm"] && window.opener["Xrm"]["Page"] && window.opener["Xrm"]["Page"]["data"] && window.opener["Xrm"]["Page"]["data"]["entity"]) {
      window[KiponXrmLOCAL_formentityr] = function () {
        var result = new XrmFormKey();
        result.id = window.opener["Xrm"]["Page"]["data"]["entity"]["getId"]();
        result.type = window.opener["Xrm"]["Page"]["data"]["entity"]["getEntityName"]();
        return result;
      }
      return this.getFormKey();
    }

    return null;
  }
}
