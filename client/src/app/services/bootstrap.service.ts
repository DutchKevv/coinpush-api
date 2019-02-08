import { Injectable } from '@angular/core';
import { app } from '../../core/app';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '../../../node_modules/@angular/common/http';

@Injectable({
	providedIn: 'root',
})
export class BootstrapService {

	constructor(private _http: HttpClient) {

	}

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