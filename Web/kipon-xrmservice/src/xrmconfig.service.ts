import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { AuthConfig } from './auth.service';

@Injectable()
export class XrmConfigService {
  private appConfig: AuthConfig;

  constructor(private http: HttpClient) { }

  loadAppConfig();
  loadAppConfig(url: string);
  loadAppConfig(url: string = null) {
    if (url == null) {
      url = '/assets/xrmConfig.json';
    }
    return this.http.get<AuthConfig>(url)
      .toPromise()
      .then(data => {
        this.appConfig = data;
      }).catch(err => {
        console.log('unable to load configuration /assets/xrmConfig.json');
        console.log(err);
      }
      );
  }

  getConfig(): AuthConfig {
    return this.appConfig;
  }
}
