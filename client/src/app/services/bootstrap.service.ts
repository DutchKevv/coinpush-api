import { Injectable } from '@angular/core';
import { app } from '../../core/app';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '../../../node_modules/@angular/common/http';

declare const window: any;

const FB_APP_ID_PROD = '178901869390909';
const FB_APP_ID_DEV = '162805194523993';

@Injectable({
	providedIn: 'root',
})
export class BootstrapService {

	constructor(private _http: HttpClient) {

	}h

	/**
	 * 
	 */
	public load(): Promise<void> {
		// boot progressbar removal
		if (app.isReady)
			return this._load();

		return new Promise((resolve, reject) => app.once('ready', () => {
			this._load();
			resolve();
		}));
	}

	private async _load(): Promise<void> {

	}
}