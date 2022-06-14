import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { XrmService } from './xrm.service';
import { XrmConfigService } from './xrmconfig.service';


export interface AuthUserProfile {
    name: string;
}

export interface AuthUser {
    profile: AuthUserProfile;
}

export interface AuthContext {
    isCallback(hash: string): boolean;
    handleWindowCallback(): void;
    getLoginError(): string;
    getCachedUser(): AuthUser;
    login(): void;
    logOut(): void;
    acquireToken(url: string, callback: any): void;
}


export interface AuthConfigEndpoint {
    orgUri: string;
}

export interface AuthConfig {
    tenant: string;
    clientId: string;
    postLogoutRedirectUri: string;
    endpoints: AuthConfigEndpoint;
    cacheLocation: string;
    version: string;
}


@Injectable()
export class XrmAuthService {
  authConfig: AuthConfig;
  obs: any;

    constructor(private xrmConfigService: XrmConfigService, private xrmService: XrmService ) { }

    authenticate(): Observable<boolean> {
        if (window["AuthenticationContext"] == null) {
            throw "You must load adal.js to the page header scripts.";
        }

        this.authConfig = this.xrmConfigService.getConfig();

        let authCtx = new window["AuthenticationContext"](this.authConfig) as AuthContext;
        let isCallback = authCtx.isCallback(window.location.hash);

        if (isCallback) {
            authCtx.handleWindowCallback();
        }

        var loginError = authCtx.getLoginError();

        if (!loginError && isCallback) {
          var x = Observable.create((_obs:any) => {
            this.obs = _obs;
          });

            setTimeout(() => {
                authCtx.acquireToken(this.authConfig.endpoints.orgUri, this.getToken);
            }, 1);
            return x;
        }

        if (loginError) {
            throw loginError;
        }

        if (!isCallback) {
            let user = authCtx.getCachedUser();
            if (user == null) {
                authCtx.login();
            } else {
                console.log(user);
            }
        }

        return Observable.create((obs:any) => {
            setTimeout(() => {
                obs.next(true);
            });
        });
    }

    private getToken(error: string, token: string): void {
        if (error) {
            console.log(error);
        }

        if (this.xrmService.debug) {
            console.log(token);
        }
        this.xrmService.token = token;
        this.obs.next(true);
    }
}
