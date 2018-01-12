import { Injectable } from '@angular/core';
import { app } from '../../core/app';

@Injectable()
export class BootstrapService {

	public load() {
		if (!app.isReady)
			return new Promise((resolve, reject) => app.once('ready', resolve));
	}
}