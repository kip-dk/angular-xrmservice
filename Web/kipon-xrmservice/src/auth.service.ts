import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { XrmService } from './xrm.service';

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
}


@Injectable()
export class AuthService {
    authConfig: AuthConfig;

    constructor(private xrmService: XrmService) { }

    authenticate(): Observable<boolean> {
        if (window["AuthenticationContext"] == null) {
            throw "You must load adal.js to the page header scripts.";
        }

        if (window["AuthenticationConfiguration"] == null) {
            throw "You must define AuthenticationConfiguration before you call authenticate method";
        }

        this.authConfig = window["AuthenticationConfiguration"] as AuthConfig;

        let authCtx = new window["AuthenticationContext"](window["AuthenticationConfiguration"]) as AuthContext;
        let isCallback = authCtx.isCallback(window.location.hash);

        if (isCallback) {
            authCtx.handleWindowCallback();
        }

        var loginError = authCtx.getLoginError();

        if (!loginError && isCallback) {

            setTimeout(() => {
                authCtx.acquireToken(this.authConfig.endpoints.orgUri, this.getToken);
            }, 1);

            return Observable.create(obs => {
            });
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

        return Observable.create(obs => {
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
    }
}