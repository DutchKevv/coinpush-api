import * as localforage from "localforage";

export class StorageHelper {

    _instance = null;

    async init() {
        // this._instance = await localforage.defineDriver(window.cordovaSQLiteDriver).then(function() {
        //     return localforage.setDriver([
        //         // Try setting cordovaSQLiteDriver if available,
        //       window.cordovaSQLiteDriver._driver,
        //       // otherwise use one of the default localforage drivers as a fallback.
        //       // This should allow you to transparently do your tests in a browser
        //       localforage.INDEXEDDB,
        //       localforage.WEBSQL,
        //       localforage.LOCALSTORAGE
        //     ]);
        // });

        this._instance = localforage.createInstance({
            size: 1428800, // 1mb
            name: 'my-app-name',
            storeName: 'setup'
            // OR instead of passing the `driver` option,
            // you can call `window.appStorage.setDriver()`
            // right after `createInstance()`
        });
    }

    public get(key: string): Promise<any> {
        return this._instance.getItem(key);
    }

    public set(key: string, value: any): Promise<any> {
        console.log(this._instance);
        // return this._instance.setItem(key, '');
        return this._instance.setItem(key, value);
    }

    public update(key: string, value: any, deep: boolean = false) {

    }

    public remove(key: string) {
        return this._instance.removeItem(key);
    }

    public clear() {
        return this._instance.clear();
    }    
}