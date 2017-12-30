import { MicroEvent } from "./helpers/classes/micro-event.helper";
import { generalHelpers } from './helpers/general';
import { StorageHelper } from "./helpers/classes/storage.helper";
import { loadCordova } from "./mobile/cordova.bootstrapper";
import { getAddress } from './app.address';
import { NotificationHelper } from "./helpers/classes/notification.helper";

export class App extends MicroEvent {

    public platform = window['platform'];
    public user: any = {
        name: 'Anonymous'
    }

    public isReady = false;
    public symbols: Array<any> = [];
    public address;
    public storage = new StorageHelper();
    public notification = new NotificationHelper();
    public helpers = generalHelpers;

    constructor() {
        super();
        this.init();
    }

    public init(): void {
        this._askNotificationPermission();
        this.address = getAddress();

        Promise.all(
            [
                this._loadSymbols(),
                Promise.resolve().then(async () => {

                    if (app.platform.isApp)
                        await loadCordova();

                    await this.storage.init();

                    await Promise.all([
                        this.notification.init(),
                        this._loadUser(),
                        this._loadConfig()
                    ]);
                })
            ]
        )
            .then(() => this.emit('ready', this.isReady = true))
            .catch(error => {
                console.error(error);
            })
    }

    public async storeUser() {
        await this.storage.set('current-user', this.user);
    }

    public async removeUser(): Promise<void> {
        await this.storage.remove('current-user');
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
        const symbols = await (await fetch(this.address.apiUrl + 'symbols')).json();

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