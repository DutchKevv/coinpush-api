import { Injectable } from '@angular/core';

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