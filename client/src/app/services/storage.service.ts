import { Injectable } from '@angular/core';
import * as localforage from "localforage";
import * as deepmerge from "deepmerge";

@Injectable({
	providedIn: 'root',
})
export class StorageService {

    private _localforage: any; 
    private _data: any = {};  

	constructor() {}

    async init(): Promise<void> {
        this._localforage = localforage.createInstance({
            // size: 10428800, // 10mb
            name: 'coinpush',
            storeName: 'data'
        });
    }

    public async update(key: string, value: any, deep: boolean = false): Promise<any> {
        const currentData = (await localforage.getItem(key)) || {};
        const newData = Object.assign(currentData, value);
        return this._localforage.setItem(key, newData);
    }

    public remove(key: string) {
        return this._localforage.removeItem(key);
    }

    public clearAll() {
        return this._localforage.clear();
    }

    public get(key: string): Promise<any> {
        return this._localforage.getItem(key);
    }

    public set(key: string, value: any): Promise<any> {
        return this._localforage.setItem(key, value);
    }

    public async updateProfile(value: any, isNew: boolean = false): Promise<any> {
        const userId = value._id || this._data._id

        // userId must be known or given
        if (!userId && isNew) {
            throw new Error('Not loggedin and no [user]_id given in data object');
        }

        // merge 'fresh' profile data
        this._data = deepmerge.all([this._data || {}, value]);

        // deepmerge does not keep unique array
        if (value.favorites) {
            this._data.favorites = value.favorites;
        }

        await this.set(`user-profile-${userId}`,  this._data);

        if (isNew) {
            await this.set('last-user-id', userId);
        }

        return  this._data;
    }

    public async clearProfile(userId): Promise<void> {
        // create new profile
        if (!userId) {
            throw new Error('Not loggedin and no [user]_id given as argument');
        }

        await this._localforage.setItem(`user-profile-${userId}`, null);
    }

    public async getAccountData(): Promise<any> {
        const lastUserId = await this.get('last-user-id');

        if (lastUserId) {
            return await this.get(`user-profile-${lastUserId}`);
        }
    }
}