import { Injectable } from '@angular/core';
import { app } from '../../core/app';
import { environment } from '../../environments/environment';

declare const window: any;

const FB_APP_ID_PROD = '178901869390909';
const FB_APP_ID_DEV = '162805194523993';

@Injectable({
	providedIn: 'root',
})
export class BootstrapService {

	public async load() {
		// boot progressbar removal
		if (!app.isReady)
			await new Promise((resolve, reject) => app.once('ready', resolve));
	}
}