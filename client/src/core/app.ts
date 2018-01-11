import { MicroEvent } from "./helpers/classes/micro-event.helper";
import { generalHelpers } from './helpers/general';
import { StorageHelper } from "./helpers/classes/storage.helper";
import { getAddress } from './app.address';
import { NotificationHelper } from "./helpers/classes/notification.helper";

export class App extends MicroEvent {

    public platform = window['platform'];
    public address;
    public storage = new StorageHelper();
    public notification = new NotificationHelper();
    public helpers = generalHelpers;

    public user;
    public data: any = {};
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

        // set initial unread notification badge count
        if (this.data.notifications)
            this.notification.updateBadgeCounter(parseInt(this.data.notifications.unreadCount, 10));

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
        const headers = new Headers();
        headers.append('pragma', 'no-cache');
        headers.append('cache-control', 'no-cache');
        headers.append('Accept', 'application/json');

        if (this.user)
            headers.append('Authorization', 'Bearer ' + this.user.token);

        this.data = await fetch(this.address.apiUrl + 'authenticate?profile=true', { headers }).then(res => res.json());
        if (this.data.user) {
            this.user = this.data.user;
            delete this.data.user;
        }
    }

    public async updateStoredUser(user = this.user): Promise<void> {
        this.user = user;
        await this.storage.set('current-user', user);
    }

    public async removeStoredUser(): Promise<void> {
        await this.storage.remove('current-user');
    }

    private async _loadStoredUser(): Promise<any> {
        const user = await this.storage.get('current-user')

        if (user && user.token)
            this.user = user
    }

    public initNotifications(): Promise<void> {
        return this.notification.init();
    }
}

export const app = window['app'] = new App();
app.init().catch(console.error);