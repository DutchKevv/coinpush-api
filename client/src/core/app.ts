import { MicroEvent } from "./helpers/classes/micro-event.helper";
import { generalHelpers } from './helpers/general';
import { StorageHelper } from "./helpers/classes/storage.helper";
import { loadCordova } from "./mobile/cordova.bootstrapper";
import { getAddress } from './app.address';
import { NotificationHelper } from "./helpers/classes/notification.helper";

export class App extends MicroEvent {

    public platform = window['platform'];
    public user: any = {
        name: 'Anonymous',
        img: './assets/image/default-profile.jpg'
    }

    public symbols: Array<any> = [];
    public address;
    public storage = new StorageHelper();
    public notification = new NotificationHelper();
    public helpers = generalHelpers;

    public isReady = false;
    public angularReady = false;
    public angularReady$ = Promise.resolve();

    constructor() {
        super();
        this.init();
    }

    public async init(): Promise<void> {
        this.address = getAddress();

        if (this.platform.isApp)
            await loadCordova();

        await this.storage.init();
        await this._loadUser();
        await this._loadData()

        this.isReady = true;
        this.emit('ready', true);
        this._askNotificationPermission();
    }

    public async _loadData() {
        const obj: any = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        };

        if (this.user.token)
            obj.headers.Authorization = 'Bearer ' + this.user.token;

        const data = await fetch(this.address.apiUrl + 'authenticate', obj).then(res => res.json());

        if (data.user)
            this.user = data.user;
        
        this.symbols = JSON.parse(data.symbols);
    }

    public async storeUser() {
        await this.storage.set('current-user', this.user);
    }

    public async removeUser(): Promise<void> {
        await this.storage.remove('current-user');
    }

    public async initNotifications() {
        await this.notification.init();
    }

    private async _loadUser(): Promise<void> {
        const user: any = await this.storage.get('current-user');
        if (user && user.token)
            this.user = user
    }

    private async _loadConfig() {
        // this.config = await fetch();
    }

    private async _loadSymbols() {
        const symbols = await (await fetch(this.address.apiUrl + 'symbol')).json();

        if (symbols && symbols.length)
            this.symbols = symbols;

        this.emit('symbols-update')
    }

    private _askNotificationPermission() {
        // Notification.requestPermission((status) => {
        //     console.log('Notification permission status:', status);
        // });
    }
}

export const app = window['app'] = new App();