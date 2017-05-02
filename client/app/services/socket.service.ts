import {Injectable} from '@angular/core';
import * as io from 'socket.io-client';

@Injectable()
export class SocketService {

	socket: any;

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
}