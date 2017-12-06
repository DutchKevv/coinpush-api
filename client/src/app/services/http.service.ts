import { Injectable } from '@angular/core';
import { ConnectionBackend, XHRBackend, RequestOptions, Request, RequestOptionsArgs, Response, Http, Headers } from '@angular/http';
import { appConfig } from '../app.config';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';

@Injectable()
export class CustomHttp extends Http {
	constructor(backend: ConnectionBackend, defaultOptions: RequestOptions) {
		super(backend, defaultOptions);
	}

	get(url: string, options?: RequestOptionsArgs): Observable<Response> {
		return super.get(this._normalizeUrl(url), this._addHeaders(options)).catch(this.handleError);
	}

	post(url: string, body: string, options?: RequestOptionsArgs): Observable<Response> {
		return super.post(this._normalizeUrl(url), body, this._addHeaders(options)).catch(this.handleError);
	}

	put(url: string, body: string, options?: RequestOptionsArgs): Observable<Response> {
		return super.put(this._normalizeUrl(url), body, this._addHeaders(options)).catch(this.handleError);
	}

	delete(url: string, options?: RequestOptionsArgs): Observable<Response> {
		return super.delete(this._normalizeUrl(url), this._addHeaders(options)).catch(this.handleError);
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
		if (error.status === 401) {
			// 401 unauthorized response so log user out of client
			window.location.href = '/#/login';
		}
		console.log(error);
		return Observable.throw(error._body);
	}
}

export function customHttpFactory(xhrBackend: XHRBackend, requestOptions: RequestOptions): Http {
	return new CustomHttp(xhrBackend, requestOptions);
}

export let customHttpProvider = {
	provide: Http,
	useFactory: customHttpFactory,
	deps: [XHRBackend, RequestOptions]
};