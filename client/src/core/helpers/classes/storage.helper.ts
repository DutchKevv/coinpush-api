import * as localforage from "localforage";
import * as deepmerge from "deepmerge";

declare let window: any;

export class StorageHelper {

    public profileData: any = {};

    private _instance: LocalForage = null;
    private _userProfileKey: string = null;

    async init(): Promise<void> {
        
        this._instance = localforage.createInstance({
            // size: 10428800, // 10mb
            name: 'CoinPush',
            storeName: 'data'
        });

        await this._preloadData();
    }

    public async update(key: string, value: any, deep: boolean = false): Promise<any> {
        const currentData = (await localforage.getItem(key)) || {};
        const newData = Object.assign(currentData, value);
        return this._instance.setItem(key, newData);
    }

    public remove(key: string) {
        return this._instance.removeItem(key);
    }

    public clearAll() {
        return this._instance.clear();
    }

    public get(key: string): Promise<any> {
        return this._instance.getItem(key);
    }

    public set(key: string, value: any): Promise<any> {
        return this._instance.setItem(key, value);
    }

    public async updateProfile(value: any, isNew: boolean = false): Promise<void> {
        // userId must be known or given
        if (!this.profileData._id && (isNew && !value._id)) {
            throw new Error('Not loggedin and no [user]_id given in data object');
        }

        // merge 'fresh' profile data
        this.profileData = deepmerge.all([this.profileData, value]);

        // deepmerge does not keep unique array
        if (value.favorites) {
            this.profileData.favorites = value.favorites;
            // this.profileData.favorites =  Array.from(new Set(this.profileData.favorites)); 
        }

        await this.set(`user-profile-${this.profileData._id}`, this.profileData);

        if (isNew) {
            await this.set('last-user-id', this.profileData._id);
        }
    }

    public async clearProfile(userId = this.profileData._id): Promise<void> {
        // create new profile
        if (!userId) {
            throw new Error('Not loggedin and no [user]_id given as argument');
        }

        this.profileData = {};
        await this._instance.setItem(`user-profile-${userId}`, null);
    }

    private async _preloadData(): Promise<any> {
        const lastUserId = await this.get('last-user-id');

        if (lastUserId) {
            const profileData = await this.get(`user-profile-${lastUserId}`);

            if (profileData && profileData._id) {
                this.profileData = profileData;
            }
        }
    }
}