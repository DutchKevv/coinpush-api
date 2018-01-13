import { Injectable } from '@angular/core';
import { app } from '../../core/app';

@Injectable()
export class BootstrapService {

	public load() {
		// boot progressbar removal
		if (!app.isReady)
			return new Promise((resolve, reject) => app.once('ready', resolve));

		app.prettyBootty.step('done');
		// clearTimeout(app.platform.prettyBootTimeout);
	}
}