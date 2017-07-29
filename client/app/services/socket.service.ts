import {Injectable, NgZone} from '@angular/core';
import * as io from 'socket.io-client';

@Injectable()
export class SocketService {

	static ERROR_TIMEOUT = 60000;

	public socket: any;

	constructor(private _zone: NgZone) {}

	init() {
		// this._zone.runOutsideAngular(() => {
			this.socket = io(this._getUrl(), {secure: true});
		// });
	}

	private _getUrl(): string {
		// Electron
		if (window.location.protocol === 'file:') {
			return 'https://localhost:3000';

		// Browser | external
		} else {
			return 'http://' + window.location.hostname + ':3000';
		}
	}

	public send(event: string, data?, cb?: Function): void {
		this._zone.runOutsideAngular(() => {
			if (typeof cb === 'function') {
				let i = setTimeout(() => cb(SocketService.ERROR_TIMEOUT), SocketService.ERROR_TIMEOUT);
				this.socket.emit(event, data, (...result) => {
					clearInterval(i);
					this._zone.run(() => cb(...result));
				});
			} else {
				this.socket.emit(event, data);
			}
		});
	}
}