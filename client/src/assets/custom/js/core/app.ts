import { MicroEvent } from "./helpers/classes/micro-event.helper";
import { generalHelpers } from './helpers/general';
import { StorageHelper } from "./helpers/classes/storage.helper";
import { loadCordova } from "./mobile/cordova.bootstrapper";
import { getAddress } from './app.address';

export class App extends MicroEvent {

    public platform = {
        version: '',
        isApp: !!window['_cordovaNative'],
        isEmulator: navigator.platform === 'Linux i686',
        isLocal: document.URL.indexOf('file://') > -1
    };

    public user: any = {
        name: 'Anonymous'
    }

    public isReady = false;
    public symbols: Array<any> = [];
    public address;
    public storage = new StorageHelper();
    public helpers = generalHelpers;

    constructor() {
        super();
    }

    public async init(): Promise<void> {
        this.address = getAddress();

        if (app.platform.isApp)
            await loadCordova();

        await this.storage.init();

        await Promise.all([
            this._loadUser(),
            this._loadConfig(),
            this._loadSymbols()
        ]);

        this.isReady = true;
        this.emit('ready', true)
    }

    public async storeUser() {
        await this.storage.set('current-user', this.user);
    }

    public async removeUser(): Promise<void> {
        await this.storage.remove('current-user');
    }

    private async _loadUser(): Promise<void> {
        const user = await this.storage.get('current-user');
        console.log('USER USER USER', user, typeof user);
        if (user && user.token)
            this.user = user;
    }

    private async _loadConfig() {
        // this.config = await fetch();
    }

    private async _loadSymbols() {
        this.symbols = await (await fetch(this.address.apiUrl + 'symbols')).json();
        this.emit('symbols-update')
    }
}

export const app = window['app'] = new App();

app.init().catch(console.error);
