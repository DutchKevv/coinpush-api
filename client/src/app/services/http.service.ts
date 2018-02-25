import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';
import { Router } from '@angular/router';
import { AuthenticationService } from './authenticate.service';
import { app } from '../../core/app';
import { HttpHeaders, HttpParams, HttpClient, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpInterceptor } from '@angular/common/http';

export interface IRequestOptions {
	headers?: HttpHeaders;
	observe?: 'body';
	params?: HttpParams;
	reportProgress?: boolean;
	responseType?: 'json';
	withCredentials?: boolean;
	body?: any;
}

// export function applicationHttpClientCreator(auth: AuthenticationService, http: HttpClient) {
// 	return new CustomHttp(http, auth);
// }

@Injectable()
export class CustomHttp implements HttpInterceptor {
	// private _authenticationService: AuthenticationService;

	constructor(
		public http: HttpClient,
		private _authenticationService: AuthenticationService
	) {}

	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		return next.handle(this._normalizeRequest(req))
			.catch((event) => {
				console.log('event', event);
				if (event instanceof HttpErrorResponse) {
					return this.catch401(event);
				}
			});
	}

	// get(url: string, options?: IRequestOptions): Observable<Response> {
	// 	return this.get(this._normalizeUrl(url), this._addHeaders(options)).catch(error => this.handleError(error));
	// }

	// post(url: string, body: any, options?: IRequestOptions): Observable<Response> {
	// 	return this.post(this._normalizeUrl(url), body, this._addHeaders(options)).catch((error, body) => this.handleError(error, body));
	// }

	// put(url: string, body: any, options?: IRequestOptions): Observable<Response> {
	// 	return this.put(this._normalizeUrl(url), body, this._addHeaders(options)).catch(error => this.handleError(error));
	// }

	// delete(url: string, options?: IRequestOptions): Observable<Response> {
	// 	return this.delete(this._normalizeUrl(url), this._addHeaders(options)).catch(error => this.handleError(error));
	// }

	private _normalizeRequest(req: HttpRequest<any>): HttpRequest<any> {
		if (!req.url.startsWith('http://') && !req.url.startsWith('https://'))
			req =  req.clone({url: (app.address.apiUrl + req.url).replace(/([^:]\/)\/+/g, "$1")});

		req = this._addHeaderJwt(req);

		return req;
	}

	private _addHeaderJwt(req: HttpRequest<any>): HttpRequest<any> {
		// add authorization header with jwt token
		if (app.user && app.user.token)
			return req.clone({ setHeaders: { Authorization: 'Bearer ' + app.user.token } });

		return req;
	}

	// private _addHeaderAppVersion(req: HttpRequest<any>): IRequestOptions {
	// 	if (window['app'].version)
	// 		options.headers.append('app-version', window['app'].version);

	// 	return options;
	// }

	// Response Interceptor
	private catch401(error: HttpErrorResponse): Observable<any> {
		// Check if we had 401 response
		if (error.status === 401) {
			// redirect to Login page for example
			return Observable.empty();
		}
		return Observable.throw(error);
	}

	private handleError(error: any, body?) {
		console.log(body, error, error.body);
		switch (error.status) {
			case 401:
				this._authenticationService.showLoginRegisterPopup();
				break;
			case 409:
				return Observable.throw(JSON.parse(error._body));
			case 424:
				if (confirm('New version available. Download now?')) {

				} else {

				}
				break;

		}

		return Observable.throw(error);
	}
}