import { Injectable } from '@angular/core';
import { StorageService } from '../storage.service';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class AccountService {

    public account$: BehaviorSubject<any> = new BehaviorSubject(defaultAccount);
    public isLoggedIn: boolean = false;

    constructor(
        private _http: HttpClient,
        private _storageService: StorageService
    ) {}
    
    public async update(data: any, isNew: boolean = false, save: boolean = false): Promise<void> {		
		data = await this._storageService.updateProfile(data, isNew);

        this.account$.next(data);
        
        if (save) {
            await this._http.put('/user/' + data._id, data).toPromise();
        }
    }
}

export const defaultAccount = {
    favorites: [],
    name: 'unknown'
}