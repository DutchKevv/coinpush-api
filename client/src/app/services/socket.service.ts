import { Injectable, Output } from '@angular/core';
import * as io from 'socket.io-client';
import { UserService } from './user.service';
import { ConfigService } from './config/config.service';

@Injectable({
    providedIn: 'root',
})
export class SocketService {

    private _socket: any = {};

    get socket() {
        return this._socket;
    }

    constructor(
        private _userService: UserService,
        private _configService: ConfigService
    ) {}

    public init(): void {
        this._socket = io('', {
            reconnectionAttempts: 10000, // avoid having user reconnect manually in order to prevent dead clients after a server restart
            timeout: 10000, // before connect_error and connect_timeout are emitted.
            // transports: ['websocket'],
            // query: 'userId=' + this._userService.model.options._id,
            secure: this._configService.platform.isSecure,
            autoConnect: false
        });
    }

    public connect() {
        this._socket.open();
    }

    public disconnect() {
        this._socket.close();
    }
}
