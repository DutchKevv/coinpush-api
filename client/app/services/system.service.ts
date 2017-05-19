import {Injectable} from '@angular/core';
import {SocketService} from './socket.service';
import {ConstantsService} from './constants.service';
import {SystemState} from '../../../shared/models/SystemState';
import {UserService} from './user.service';

@Injectable()
export class SystemService {

	private _systemState = new SystemState();
	private _initialLoginShown = false;

	get systemState() {
		return this._systemState;
	}

	constructor(private _socketService: SocketService,
				private _constantsService: ConstantsService,
				private _userService: UserService) {
	}

	init() {

		this._socketService.socket.on('disconnect', () => this._setOffline());
		this._socketService.socket.on('connect_error', () => this._setOffline());

		this._socketService.socket.on('system:state', (systemState: SystemState) => {
			this._systemState = new SystemState(systemState);

			if (!this._initialLoginShown) {
				if (!this._systemState.booting && this._systemState.connected === false) {
					this._initialLoginShown = true;
					this._userService.login();
				}
			}
		});
	}

	private _setOffline() {
		this._systemState.state = this._constantsService.constants.SYSTEM_STATE_ERROR;
		this._systemState.code = this._constantsService.constants.SYSTEM_STATE_CODE_NO_SERVER_CONNECTION;
		this._systemState.connected = false;
		this._systemState.workers = 0;
	}
}