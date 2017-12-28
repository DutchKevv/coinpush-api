const platform = window['platform'];

export class StorageHelper {


    private _nameSpace: string = 'CoinPush';
    private _ss: any;

    constructor() { }

    async init() {
        if (platform.isApp)
            await this._initAppStorage();
    }

    public get(key: string) {
        return platform.isApp ? this._getApp(key) : this._getWeb(key);
    }

    public set(key: string, value: any) {
        return platform.isApp ? this._setApp(key, value) : this._setWeb(key, value);
    }

    public update(key: string, value: any, deep: boolean = false) {

    }

    public remove(key: string) {
        return platform.isApp ? this._removeApp(key) : this._removeWeb(key);
    }

    private _getWeb(key: string) {
        let value = localStorage.getItem(key);

        try {
            return JSON.parse(value);
        } catch (error) { }

        return value;
    }

    private _setWeb(key: string, value: string) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    private _removeWeb(key) {
        localStorage.removeItem(key);
    }

    private _getApp(key: string) {
        return new Promise((resolve, reject) => {
            this._ss.get(value => {
                try {
                    resolve(JSON.parse(value));
                } catch (error) {
                    resolve(value);
                }
            }, error => {
                if (error.message !== `Key [_SS_${key}] not found.`)
                    reject(error);

                resolve();
            }, key);
        });
    }

    private _setApp(key: string, value: string) {
        return new Promise((resolve, reject) => {
            this._ss.set(resolve, reject, key, JSON.stringify(value));
        });
    }

    private _removeApp(key) {
        return new Promise((resolve, reject) => {
            this._ss.remove(resolve, reject, key);
        });
    }

    private _initAppStorage() {
        return new Promise((resolve, reject) => {
            this._ss = new window['cordova'].plugins.SecureStorage(resolve, (error, message) => {
                console.log(error,typeof error, error.message);
                if (!error || error.message !== 'Device is not secure')
                    return reject(error);

                this._ss.secureDevice(resolve, reject);
            }, this._nameSpace);
        })
    }
}