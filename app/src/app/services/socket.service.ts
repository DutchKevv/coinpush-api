import {Injectable, NgZone} from '@angular/core';
import * as io from 'socket.io-client';
import { appConfig } from '../app.config';

@Injectable()
export class SocketService {

	static ERROR_TIMEOUT = 60000;

	public socket: any;

	constructor(private _zone: NgZone) {}

	public connect() {
		// this._zone.runOutsideAngular(() => {
			this.socket = io(appConfig.ip + ':' + appConfig.port, {
				'reconnectionAttempts': 10, // avoid having user reconnect manually in order to prevent dead clients after a server restart
				'timeout': 10000, // before connect_error and connect_timeout are emitted.
				'transports': ['websocket'],
				path: '/ws/general/'
			});
		// });
	}

	public disconnect() {
		this._zone.runOutsideAngular(() => {
			this.socket.disconnect();
		});
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