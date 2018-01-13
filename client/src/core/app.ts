import { MicroEvent } from "./helpers/classes/micro-event.helper";
import { generalHelpers } from './helpers/general';
import { StorageHelper } from "./helpers/classes/storage.helper";
import { getAddress } from './app.address';
import { NotificationHelper } from "./helpers/classes/notification.helper";

class PrettyBootty {

    public progress: number = 0;

    constructor(
        private _steps: Array<any>,
        private _progressBarEl: any
    ) { }

    step(id: string, percentage?: number) {
        const step = this._steps.find(step => step.id === id);

        if (!step)
            throw new Error(`step not found: ${id}`);

        step.perc = typeof percentage === 'number' && percentage < 100 ? percentage : 100;

        let total = 0;
        this._steps.forEach(step => step.perc && (total += step.perc / this._steps.length));

        this._updateEl(total, step.text);

        if (id === 'done')
            this.destroy();
    }

    public fakeProgress(id, time: number, start = 0, end = 0) {
        const step = this._steps.find(step => step.id === id);
        const startTime = Date.now();

        const interval = setInterval(() => {
            const timeDone = Date.now() - startTime;
            this.step(step.id, (timeDone / time) * 100);
        }, 100);
    }

    public destroy() {
        if (!this._progressBarEl || !this._progressBarEl.parentNode)
            return;

        this._progressBarEl.parentNode.style.opacity = 0;

        setTimeout(() => {
            if (!this._progressBarEl || !this._progressBarEl.parentNode || !this._progressBarEl.parentNode.parentNode)
                return;

            this._progressBarEl.parentNode.parentNode.removeChild(this._progressBarEl.parentNode);
        }, 500)
    }

    private _updateEl(progress, text) {
        if (this._progressBarEl) {
            this._progressBarEl.children[0].innerHTML = `${progress.toFixed(0)}% ${text}`;
            this._progressBarEl.children[1].style.width = `${progress}%`;
        }
    }
}

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


    private _boottySteps = [
        {
            id: 'init',
            value: 5,
            text: 'booting'
        },
        {
            id: 'config',
            value: 5,
            text: 'config'
        },
        {
            id: 'data',
            value: 40,
            text: 'data'
        },
        {
            id: 'statics',
            value: 48,
            text: 'statics'
        },
        {
            id: 'done',
            value: 2,
            text: 'done'
        }
    ];

    public prettyBootty: PrettyBootty = new PrettyBootty(this._boottySteps, document.getElementById('initialProgressBar'));

    constructor() {
        super();
        this.prettyBootty.step('init');
    }

    public async init(): Promise<void> {
        this.prettyBootty.step('config');

        this.address = getAddress();
        await this._loadStoredUser();


        this.prettyBootty.step('data', 0);

        await this._preload()

        // set initial unread notification badge count
        if (this.data.notifications)
            this.notification.updateBadgeCounter(parseInt(this.data.notifications.unreadCount, 10));

        await this._waitUntilAllScriptsLoaded();

        this.isReady = true;
        this.emit('ready', true);
    }

    /**
     * preload
     */
    private _preload(): Promise<Array<any>> {
        const imageUrls = ['./spritesheet.png'];

        return Promise.all([

            // images
            ...imageUrls.map(imageUrl => {
                return new Promise(resolve => {
                    let img = new Image();
                    img.src = imageUrl;
                    img.onload = img.onerror = resolve;
                });
            }),

            // app data (user, symbols etc)
            new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', this.address.apiUrl + 'authenticate?profile=true', true);

                // user authentication token
                xhr.setRequestHeader('Authorization', this.user ? 'Bearer ' + this.user.token : '');

                // on progress
                xhr.onprogress = event => this.prettyBootty.step('data', (event.loaded / event.total) * 100);

                // on finish
                xhr.onload = () => {
                    this.data = JSON.parse(xhr.response);

                    if (this.data.user) {
                        this.user = this.data.user;
                        delete this.data.user;
                    }

                    resolve();
                }

                // on error
                xhr.onerror = reject;

                xhr.send();
            })
        ]);
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

    private _waitUntilAllScriptsLoaded() {
        return new Promise((resolve, reject) => {
            const estimatedTime = (Date.now() - this.platform.startTime.getTime()) * 2.5;
            this.prettyBootty.fakeProgress('statics', estimatedTime);

            // all scripts loaded
            if (document.readyState !== 'loading')
                return resolve();

            // wait for scripts
            document.addEventListener('DOMContentLoaded', function callback() {
                document.removeEventListener('DOMContentLoaded', callback, false);
                resolve();
            }, false);
        });
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