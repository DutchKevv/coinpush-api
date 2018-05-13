import { Injectable, Output } from '@angular/core';
import * as io from 'socket.io-client';
import { UserService } from './user.service';
import { app } from '../../core/app';

@Injectable({
	providedIn: 'root',
})
export class StorageService {

    private _data: any = {};

	constructor() {}
    
    public async init(): Promise<any> {
       await this._loadStorage();
    }

    private async _loadStorage(): Promise<any> {
        // this._dat
    }
}