import {Injectable} from '@angular/core';
import * as io from 'socket.io-client';

@Injectable()
export class SocketService {

	static ERROR_TIMEOUT = 1;

	socket: any;

	private _timeout = 60000;

	constructor() {
	}

	init() {
		this.socket = io(this._getUrl());
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

	public emit(event, data, cb) {
		if (typeof cb === 'function') {
			let i = setTimeout(() => cb(SocketService.ERROR_TIMEOUT), this._timeout);

			this.socket.emit(event, data, (result) => {
				clearInterval(i);
				cb(null, result);
			});
		} else {
			this.socket.emit(event, data);
		}
	}

	public bla() {
		this.emit('asdfs', {}, function(err, result) {
			if (err === SocketService.ERROR_TIMEOUT) {

			}
		})
	}
}

