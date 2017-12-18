import { Injectable, Injector } from '@angular/core';
import { ConnectionBackend, XHRBackend, RequestOptions, Request, RequestOptionsArgs, Response, Http, Headers } from '@angular/http';
import { appConfig } from '../app.config';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';
import { Router } from '@angular/router';
import { AuthenticationService } from './authenticate.service';
import { ModalService } from './modal.service';
import { LoginComponent } from '../components/login/login.component';

@Injectable()
export class CustomHttp extends Http {
	private _authenticationService: AuthenticationService;

	constructor(
		backend: ConnectionBackend,
		defaultOptions: RequestOptions,
		router: Router,
		injector: Injector
	) {
		super(backend, defaultOptions);
		setTimeout(() => {
			this._authenticationService = injector.get(AuthenticationService);
		}, 0);
	}

	get(url: string, options?: RequestOptionsArgs): Observable<Response> {
		return super.get(this._normalizeUrl(url), this._addHeaders(options)).catch(error => this.handleError(error));
	}

	post(url: string, body: string, options?: RequestOptionsArgs): Observable<Response> {
		return super.post(this._normalizeUrl(url), body, this._addHeaders(options)).catch(error => this.handleError(error));
	}

	put(url: string, body: string, options?: RequestOptionsArgs): Observable<Response> {
		return super.put(this._normalizeUrl(url), body, this._addHeaders(options)).catch(error => this.handleError(error));
	}

	delete(url: string, options?: RequestOptionsArgs): Observable<Response> {
		return super.delete(this._normalizeUrl(url), this._addHeaders(options)).catch(error => this.handleError(error));
	}

	private _normalizeUrl(url: string) {
		url = appConfig.apiUrl + url;
		url = url.replace(/([^:]\/)\/+/g, "$1");
		return url;
	}

	private _addHeaders(options?: RequestOptionsArgs): RequestOptionsArgs {
		// ensure request options and headers are not null
		options = options || new RequestOptions();
		options.headers = options.headers || new Headers();

		this._addHeaderJwt(options);
		this._addHeaderAppVersion(options);

		return options;
	}

	private _addHeaderJwt(options: RequestOptionsArgs): RequestOptionsArgs {
		// add authorization header with jwt token
		let currentUser = JSON.parse(localStorage.getItem('currentUser'));
		if (currentUser && currentUser.token)
			options.headers.append('Authorization', 'Bearer ' + currentUser.token);

		return options;
	}

	private _addHeaderAppVersion(options: RequestOptionsArgs): RequestOptionsArgs {
		if (window['app'].version)
			options.headers.append('app-version', window['app'].version);

		return options;
	}

	private handleError(error: any) {
		switch (error.status) {
			case 401:
				this._authenticationService.showLoginRegisterPopup();
				break;
			case 424:
				if (confirm('New version available. Download now?')) {
					
				} else {
					
				}
				break;

		}

		return Observable.throw(error._body);
	}
}