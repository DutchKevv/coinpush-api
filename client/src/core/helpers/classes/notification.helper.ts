import { app } from '../../app';

declare let firebase: any;
declare let PushNotification: any;
declare let FCMPlugin: any;
declare let cordova: any;
declare var Notification: any;

export class NotificationHelper {

    private _token: string = null;
    private _originalTitle = document.title;

    private _firebaseMessaging = null;

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
                    // if (cordova.plugins.notification)
                    //     cordova.plugins.notification.badge.set(newValue);
                } else {
                    document.title = this._originalTitle + ` (${newValue})`;
                }
            }
            else {
                if (app.platform.isApp) {
                    // if (cordova.plugins.notification)
                    //     cordova.plugins.notification.badge.clear();
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
            await this._firebaseMessaging.requestPermission();
            const token = await this._firebaseMessaging.getToken();
            if (token) {
                this._token = token;
                app.emit('firebase-token-refresh', this._token);
            } else {
                console.warn('empty token received');
            }
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * handle notification
     * @param message 
     */
    private _onNotification(message: any): void {
        console.log('_onNotification', message);

        try {
            if (!message.data)
                console.info('no-data', message);

            const data = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;

            if (app.storage.profileData._id !== data.__userId)
                return console.warn('**notification __userId mismatch**');

            if (!data.title) {
                data.title = message.title;
            }

            app.emit('notification', { data });

        } catch (error) {
            console.info('message', message);
            console.error(error);
        }
    }

    /**
     * browser (firebase)
     */
    private _loadBrowser(): Promise<any> {
        return new Promise((resolve, reject) => {
            // firebase script
            let script = document.createElement('script');
            script.src = 'https://www.gstatic.com/firebasejs/4.8.1/firebase.js';
            script.async = true;
            script.onload = () => {

                const config = {
                    apiKey: "AAAAcOdrZII:APA91bHdt3bPaqUW4sWF7tht0xJs13B_X-4Svm4TlWeLnXXFoVsPxWRQGxUPdqudCP1OHkQ-IJCVO10DJKi8G2fLekqfpy0xAXGakQmj-7FZW3DwB18BxcHNIWlgNC9T3T1tbXEnbaxM",
                    // authDomain: "<PROJECT_ID>.firebaseapp.com",
                    messagingSenderId: '484918912130',
                };

                firebase.initializeApp(config);
                this._firebaseMessaging = window['messaging_'] = firebase.messaging();

                this._firebaseMessaging.onMessage((message) => {
                    // function is only get called when on foreground 
                    message.data.foreground = true;
                    this._onNotification(message);
                });

                this._firebaseMessaging.onTokenRefresh(async () => {
                    this._token = await this._firebaseMessaging.getToken();
                    app.emit('firebase-token-refresh', this._token);
                });

                this.askPermissionBrowser().catch(console.error);

                resolve();
            }

            document.head.appendChild(script);
        });
    }

    private async _loadApp() {
        const push = PushNotification.init({
            android: {
                icon: "icon",
                sound: true,
                vibrate: true,
                iconColor: "#ffd700"
            },
            browser: {
                pushServiceURL: 'http://push.api.phonegap.com/v1/push'
            },
            ios: {
                alert: "true",
                badge: "true",
                sound: "true"
            },
            windows: {}
        });

        push.on('registration', (data) => {
            this._token = data.registrationId;
            app.emit('firebase-token-refresh', this._token);
        });

        push.on('notification', (data) => {
            console.log('PushNotification!', data);
            data.data = Object.assign({}, data.additionalData);
            delete data.additionalData;
            this._onNotification(data);
        });

        push.on('error', error => {
            console.log(error);
        });

        push.on('accept', (data) => {
            console.log('accept????', data);
            // do something with the notification data

            push.finish(() => {
                console.log('accept callback finished');
            }, () => {
                console.log('accept callback failed');
            }, data.additionalData.notId);
        });

        push.on('reject', (data) => {
            console.log('asdfasdf', data);
            // do something with the notification data

            push.finish(() => {
                console.log('accept callback finished');
            }, () => {
                console.log('accept callback failed');
            }, data.additionalData.notId);
        });

        push.on('maybe', (data) => {
            console.log('maybe???????', data);
            // do something with the notification data

            push.finish(() => {
                console.log('accept callback finished');
            }, () => {
                console.log('accept callback failed');
            }, data.additionalData.notId);
        });

        PushNotification.createChannel(
            () => {
                console.log('success');
            },
            () => {
                console.log('error');
            },
            {
                id: 'channel1',
                description: 'My first test channel',
                importance: 3
            }
        );

        PushNotification.hasPermission(data => {
            if (!data.isEnabled) {
                console.log('NO PUSH PERMISSION!');
            }
        });

        // cordova.plugins.firebase.messaging.requestPermission((data) => {
        //     cordova.plugins.firebase.messaging.getToken(token => {
        //         this._token = token;
        //         app.emit('firebase-token-refresh', this._token);
        //     }, console.error);
        // });

        // cordova.plugins.firebase.messaging.onMessage(notification => this._onNotification(notification), function (error) {
        //     throw error;
        // });

        // cordova.plugins.firebase.messaging.onTokenRefresh((token) => {
        //     this._token = token;
        //     app.emit('firebase-token-refresh', this._token);
        // }, function (error) {
        //     console.error(error);
        // });
    }
}