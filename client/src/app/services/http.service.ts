import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { HttpHeaders, HttpParams, HttpClient, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpInterceptor } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { UserService } from './user.service';
import { ConfigService } from './config/config.service';
import { AccountService } from './account/account.service';

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
		private _configService: ConfigService,
		private _accountService: AccountService,
		private _authenticationService: AuthService
	) { }

	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		return next.handle(this._normalizeRequest(req)).pipe(catchError((event) => this._catchError(event)));
	}

	private _normalizeRequest(req: HttpRequest<any>): HttpRequest<any> {
		if (!req.url.startsWith('http://') && !req.url.startsWith('https://')) {
			const url = normalizeUrl(this._configService.address.api.prefix + req.url);
			req = req.clone({ url });
		}
		
		req = this._addHeaders(req);

		return req;
	}

	private _addHeaders(req: HttpRequest<any>): HttpRequest<any> {
	
		// add authorization header with jwt token
		const userToken = this._accountService.account$.getValue().token;
		const headers: any = {
			setHeaders: {
				cv: this._configService.version
			}
		};

		if (userToken) {
			headers.setHeaders.authorization = 'Bearer ' + userToken;
		}
			
		return req.clone(headers);
	}

	// Response Interceptor
	private _catchError(error: HttpErrorResponse): Observable<any> {
		// Check if we had error response]
		switch (error.status) {
			case 400:
				console.log(error);
				return throwError(error.error || error);
			case 401:
				// user token invalid, so logout
				if (this._accountService.isLoggedIn) {
					this._authenticationService.logout();
				}
				// user should login
				else {
					this._authenticationService.showLoginRegisterPopup();
				}
				break;
			case 409:
				return throwError(error.error || error);
			case 424:
				if (confirm('New version available. Download now?')) {

				} else {

				}
				break;
			default:
				return throwError(error.error || error);
		}

		return throwError(error);
	}
}

export function normalizeUrl(url: string): string {
	return url.replace(/([^:]\/)\/+/g, "$1");
}