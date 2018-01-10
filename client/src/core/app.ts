import { MicroEvent } from "./helpers/classes/micro-event.helper";
import { generalHelpers } from './helpers/general';
import { StorageHelper } from "./helpers/classes/storage.helper";
import { getAddress } from './app.address';
import { NotificationHelper } from "./helpers/classes/notification.helper";

export class App extends MicroEvent {

    public platform = window['platform'];
    public user: any = {
        name: 'Anonymous',
        img: './assets/image/default-profile.jpg'
    }

    public symbols: Array<any> = [];
    public notificationsData: any = {};
    public address;
    public storage = new StorageHelper();
    public notification = new NotificationHelper();
    public helpers = generalHelpers;

    public isReady = false;
    public angularReady = false;
    public angularReady$ = Promise.resolve();

    constructor() {
        super();
    }

    public async init(): Promise<void> {
        this.address = getAddress();

        await this._loadStoredUser();
        await this._loadData()

        this.isReady = true;
        this.emit('ready', true);
    }

    // TODO: move to helper class
    public loadAds() {
        
        // TODO: Desktop ads
        if (!this.platform.isApp)
            return;

        let admobid: { banner?: string, interstitial?: string } = {};
        
        if (/(android)/i.test(navigator.userAgent)) { // for android & amazon-fireos
            admobid.banner = 'ca-app-pub-1181429338292864/7213864636';
            admobid.interstitial = 'ca-app-pub-1181429338292864/7213864636';
        } else if (/(ipod|iphone|ipad)/i.test(navigator.userAgent)) { // for ios
            admobid.banner = 'ca-app-pub-1181429338292864/7213864636';
            admobid.interstitial = 'ca-app-pub-1181429338292864/7213864636';
        }
    
        window['AdMob'].createBanner({
            adSize: 'BANNER',
            overlap: true,
            height: 60, // valid when set adSize 'CUSTOM'
            adId: admobid.banner,
            position: window['AdMob'].AD_POSITION.BOTTOM_CENTER,
            autoShow: true,
            isTesting: false
        });
    
        document.addEventListener('onAdFailLoad', function (error) {
            console.error(error);
        });
    }

    private async _loadData() {
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
            
        if (data.notifications)
            this.notificationsData = data.notifications;

        this.symbols = JSON.parse(data.symbols);
    }

    public async updateStoredUser() {
        await this.storage.set('current-user', this.user);
    }

    public async removeStoredUser(): Promise<void> {
        await this.storage.remove('current-user');
    }

    private async _loadStoredUser(): Promise<any> {
        const user = await this.storage.get('current-user')

        if (user && user.token)
            this.user = user
    }

    public async initNotifications() {
        // only load when user is loggedin
        if (this.user._id)
            await this.notification.init();
    }

    private async _loadSymbols() {
        const symbols = await (await fetch(this.address.apiUrl + 'symbol')).json();

        if (symbols && symbols.length)
            this.symbols = symbols;

        this.emit('symbols-update')
    }
}

export const app = window['app'] = new App();
app.init().catch(console.error);