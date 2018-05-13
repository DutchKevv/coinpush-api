import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';
import { Router } from '@angular/router';
import { AuthenticationService } from './authenticate.service';
import { app } from '../../core/app';
import { HttpHeaders, HttpParams, HttpClient, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpInterceptor } from '@angular/common/http';

declare const require: any;

const config = require('../../custom_config.json');

export interface IRequestOptions {
	headers?: HttpHeaders;
	observe?: 'body';
	params?: HttpParams;
	reportProgress?: boolean;
	responseType?: 'json';
	withCredentials?: boolean;
	body?: any;
}

@Injectable({
	providedIn: 'root',
})
export class CustomHttp implements HttpInterceptor {
	constructor(
		public http: HttpClient,
		private _authenticationService: AuthenticationService
	) { }

	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		return next.handle(this._normalizeRequest(req)).catch((event) => this.catch401(event));
	}

	private _normalizeRequest(req: HttpRequest<any>): HttpRequest<any> {
		if (!req.url.startsWith('http://') && !req.url.startsWith('https://'))
			req = req.clone({ url: (app.address.apiUrl + req.url).replace(/([^:]\/)\/+/g, "$1") });

		req = this._addHeaderJwt(req);

		return req;
	}

	private _addHeaderJwt(req: HttpRequest<any>): HttpRequest<any> {
		// add authorization header with jwt token
		if (app.storage.profileData.token)
			return req.clone({
				setHeaders: {
					Authorization: 'Bearer ' + app.storage.profileData.token,
					clientversion: config.version
				}
			});

		return req;
	}

	// Response Interceptor
	private catch401(error: HttpErrorResponse): Observable<any> {
		// Check if we had 401 response
		switch (error.status) {
			case 401:
				this._authenticationService.showLoginRegisterPopup();
				break;
			case 409:
				return Observable.throw(error);
			case 424:
				if (confirm('New version available. Download now?')) {

				} else {

				}
				break;
			default:
				return Observable.throw(error);
		}

		return Observable.throw(error);
	}
}