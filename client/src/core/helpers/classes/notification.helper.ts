import { app } from '../../app';

declare let firebase: any;
declare let FirebasePlugin: any;
declare let cordova: any;

export class NotificationHelper {

    private _token: string = null;
    private _originalTitle = document.title;

    get token() {
        return this._token;
    }

    public async init(): Promise<void> {
        if (app.platform.isApp) {
            await this._loadApp();
        } else {
            await this._loadBrowser();
        }
    }

    /**
     * update the badge or tab title counter
     * @param newValue 
     */
    public updateBadgeCounter(newValue: number) {
        try {
            if (newValue) {
                if (app.platform.isApp) {
                    cordova.plugins.notification.badge.set(newValue);
                } else {
                    document.title = this._originalTitle + ` (${newValue})`;
                }
            }
            else {
                if (app.platform.isApp) {
                    cordova.plugins.notification.badge.clear();
                } else {
                    document.title = this._originalTitle;
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * ask user to allow push messages on browser
     */
    public async askPermissionBrowser() {
        try {
            const messaging = firebase.messaging();
            await messaging.requestPermission();
            this._token = await messaging.getToken();
            app.emit('firebase-token-refresh', this._token);
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * handle notification
     * @param message 
     */
    private _onNotification(message: any): void {
        try {
            if (!message.data)
                console.info('no-data', message);

            const body = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;

            if (!app.user || !app.user._id || app.user._id !== body.__userId)
                return console.warn('notification __userId mismatch')

            app.emit('notification', { title: message.title, data: body });

        } catch (error) {
            console.info('message', message);
            console.error(error);
        }
    }

    /**
     * browser (firebase)
     */
    private async _loadBrowser() {
        return new Promise((resolve, reject) => {
            // firebase script
            let script = document.createElement('script');
            script.src = 'https://www.gstatic.com/firebasejs/4.8.1/firebase.js';
            script.async = true;
            script.onload = () => {

                const config = {
                    apiKey: "AAAAcOdrZII:APA91bHdt3bPaqUW4sWF7tht0xJs13B_X-4Svm4TlWeLnXXFoVsPxWRQGxUPdqudCP1OHkQ-IJCVO10DJKi8G2fLekqfpy0xAXGakQmj-7FZW3DwB18BxcHNIWlgNC9T3T1tbXEnbaxM",
                    // authDomain: "<PROJECT_ID>.firebaseapp.com",
                    messagingSenderId: "484918912130",
                };

                firebase.initializeApp(config);
                const messaging = firebase.messaging();

                messaging.onMessage((message) => this._onNotification(message.data));

                messaging.onTokenRefresh(async () => {
                    this._token = await messaging.getToken();
                    app.emit('firebase-token-refresh', this._token);
                });

                this.askPermissionBrowser().catch(console.error);

                resolve();
            }

            document.head.appendChild(script);
        });
    }

    /**
     * app (cordova + firebase)
     */
    private _loadApp() {
        // set badge style 
        cordova.plugins.notification.badge.configure({ indicator: 'circular', autoClear: false });

        FirebasePlugin.hasPermission((data) => {
            if (!data.isEnabled)
                FirebasePlugin.grantPermission((result) => {
                    FirebasePlugin.getToken(token => {
                        this._token = token;

                    });
                });
            else {
                FirebasePlugin.getToken(token => {
                    this._token = token;

                });
            }
        });

        FirebasePlugin.onNotificationOpen(notification => this._onNotification(notification), function (error) {
            throw error;
        });

        FirebasePlugin.onTokenRefresh((token) => {
            this._token = token;
            app.emit('firebase-token-refresh', this._token);
        }, function (error) {
            console.error(error);
        });
    }
}