import { app } from '../../app';

declare let firebase: any;
declare let PushNotification: any;
declare let FCMPlugin: any;
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
        console.log(message);
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

                messaging.onMessage((message) => this._onNotification(message));

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
            console.log('message!', data);
            data.data = Object.assign({}, data.additionalData);
            delete data.additionalData;
            this._onNotification(data);
            // data.message,
            // data.title,
            // data.count,
            // data.sound,
            // data.image,
            // data.additionalData
        });

        push.on('error', error => {
            console.log(error);
        });

        push.on('accept', (data) => {
            console.log('asdfasdf', data);
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
            console.log('asdfasdf', data);
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

        // try {
        //     // set badge style 
        //     cordova.plugins.notification.badge.configure({ indicator: 'circular', autoClear: false });

        //     const permis = await cordova.plugins.firebase.messaging.requestPermission();

        //     cordova.plugins.firebase.messaging.onMessage(payload => {
        //         payload.data = JSON.parse(payload.data);
        //         this._onNotification(payload);
        //     });

        //     cordova.plugins.firebase.messaging.onBackgroundMessage((payload) => {
        //         payload.data = JSON.parse(payload.data);
        //         this._onNotification(payload);
        //     });

        //     this._token = await cordova.plugins.firebase.messaging.getToken();
        //     app.emit('firebase-token-refresh', this._token);

        // } catch (error) {
        //     console.error(error);
        // }

        //     app.emit('firebase-token-refresh', this._token);



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