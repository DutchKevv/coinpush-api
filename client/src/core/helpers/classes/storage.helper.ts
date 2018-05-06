import * as localForage from "localforage";

declare let window: any;

const platform = window.platform
const cordova = window.cordova

export class StorageHelper {

    public get(key: string): Promise<any> {
        return localForage.getItem(key);
    }

    public set(key: string, value: any) {
        return localForage.setItem(key, value);
    }

    public update(key: string, value: any, deep: boolean = false) {

    }

    public remove(key: string) {
        return localForage.removeItem(key);
    }

    public clear() {
        return localForage.clear();
    }    
}