import { MicroEvent } from "./helpers/classes/micro-event.helper";
import { generalHelpers } from './helpers/general';
import { StorageHelper } from "./helpers/classes/storage.helper";
import address from './app.address';
import { NotificationHelper } from "./helpers/classes/notification.helper";

// const config = require('../custom_config.json');

export class App extends MicroEvent {

    public platform = window['platform'];
    public address = address;
    public storage = new StorageHelper();
    public notification = new NotificationHelper();
    public helpers = generalHelpers;

    public data: any = {
        notifications: {
            unreadCount: 0
        }
    };
    public isReady = false;
    public angularReady = false;
    public angularReady$ = Promise.resolve();

    public async init(): Promise<void> {
        await this.storage.init();

        try {
            await this._preload()

            // set initial unread notification badge count
            if (this.data.notifications) {
                this.notification.updateBadgeCounter(parseInt(this.data.notifications.unreadCount, 10));
            }
        } catch (error) {
            console.error(error);
        }

        await this._waitUntilAllScriptsLoaded();

        this.isReady = true;
        this.emit('ready', true);
        this.loadAds();
    }

    // TODO: move to helper class
    public loadAds(retry = 0) {
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
            // height: 60, // valid when set adSize 'CUSTOM'
            adId: admobid.banner,
            position: window['AdMob'].AD_POSITION.BOTTOM_CENTER,
            autoShow: true,
            isTesting: false
        });

        document.addEventListener('onAdFailLoad', (error) => {
            console.log('Could not load ad', error);

            if (++retry < 10) {
                // setTimeout(() =>  this.loadAds(retry), 5000);
            }
        });
    }

    /**
     * preload
     */
    private async _preload(): Promise<void> {
        const imageUrls = ['./spritesheet.png', './assets/image/cover.svg'];
        const authUrl = this.address.apiUrl + 'authenticate?profile=true';

        // images
        try {
            await Promise.all(
                imageUrls.map(imageUrl => {
                    return new Promise(resolve => {
                        let img = new Image();
                        img.src = imageUrl;
                        img.onload = img.onerror = resolve;
                    });
                })
            );
        } catch (error) {
            console.error(error);
        }

        const headers: any = {
            'cv': "0.0.2",
            [this.storage.profileData.token ? 'authorization' : undefined]: 'Bearer ' + this.storage.profileData.token
            // 'cv': config.clientVersion
        };

        return fetch(authUrl, { headers }).then(async response => {
            try {
                this.data = await response.json();

                if (this.data.user) {
                    // delete this.data.user.token;
                    await this.storage.updateProfile(this.data.user);
                    delete this.data.user;
                }
            } catch (error) {
                console.error(error);
            }
            return this.data;
        }).catch(async error => {
            switch (error.status) {
                case 400:
                    if (error && error.reason) {
                        switch (error.reason) {
                            case 'clientVersion':
                                this._onClientVersionError();
                                break;
                        }
                    }
                    break;
                case 401:
                    await this.storage.clearProfile(this.storage.profileData._id);
                    window.location.reload();
                    return;
                case 0:
                case 404:
                case 500:
                case 502:
                case 503:
                case 504:
                    console.error('servers cannot be reached');
            }
        });
    }

    private _waitUntilAllScriptsLoaded() {
        return new Promise((resolve, reject) => {
            const estimatedTime = (Date.now() - this.platform.startTime.getTime()) * 2.5;

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

    private _onClientVersionError() {
        // App
        if (app.platform.isApp) {
            alert('please update app');
        }
        // browser
        else {
            const firstReload = !window.localStorage.getItem('reload-reason');

            if (firstReload) {
                window.localStorage.setItem('reload-reason', JSON.stringify({ reason: 'clientVersion' }));
                window.location.reload();
                return;
            }

            window.localStorage.removeItem('reload-reason');
        }
    }
}

export const app = window['app'] = new App();
window['app'] = app;

// self start if not app (no need to wait for cordova)
if (!window['platform'].isApp) {
    app.init().catch(console.error);
}