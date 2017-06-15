import {ChangeDetectorRef, Injectable, NgZone} from '@angular/core';
import * as io from 'socket.io-client';

@Injectable()
export class SocketService {

	static ERROR_TIMEOUT = 1;

	socket: any;

	private _timeout = 60000;

	constructor(private _zone: NgZone) {}

	init() {
		// this._zone.runOutsideAngular(() => {
			this.socket = io(this._getUrl());
		// });
	}

	private _getUrl(): string {
		// Electron
		if (window.location.protocol === 'file:') {
			return 'http://localhost:3000';

		// Browser | external
		} else {
			return window.location.hostname + ':3000';
		}
	}

	public send(event, data, cb) {
		this._zone.runOutsideAngular(() => {
			if (typeof cb === 'function') {
				let i = setTimeout(() => cb(SocketService.ERROR_TIMEOUT), this._timeout);

				this.socket.emit(event, data, (result) => {
					clearInterval(i);
					cb(result);
				});
			} else {
				this.socket.emit(event, data);
			}

		});
	}
}