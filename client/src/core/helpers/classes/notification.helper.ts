declare let firebase: any;
declare let FirebasePlugin: any;

import { app } from '../../app';

export class NotificationHelper {

    private _token: string = null;

    get token() {
        return this._token;
    }

    constructor() {

    }

    public init() {
        if (app.platform.isApp) {
            return this._loadApp();
        } else {
            return this._loadBrowser();
        }
    }

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

    private _onNotification(notification: any): void {
        const body = JSON.parse(notification.body);
        
        if (notification.userId !== app.user._id) {
            return console.warn('notification userId mismatch')
        }

        switch (body.type) {
            case 'post-comment':
                window.location.hash = '#/comment/' + body.parentId + '?focus=' + body.commentId;
                break;
            case 'post-like':
                window.location.hash = '#/comment/' + body.commentId;
                break;
            case 'comment-like':
                window.location.hash = '#/comment/' + body.parentId + '?focus=' + body.commentId;
                break
            case 'symbol-alarm':
                window.location.hash = '#/symbols/?symbol=' + body.symbol;
                app.emit('event-triggered', Object.assign(body, {title: notification.title}));
                break
            default:
                console.error('Uknown notification type: ' + body.type);
        }
    }

    /**
     * browser (firebase)
     */
    private async _loadBrowser() {
        const config = {
            apiKey: "AAAAcOdrZII:APA91bHdt3bPaqUW4sWF7tht0xJs13B_X-4Svm4TlWeLnXXFoVsPxWRQGxUPdqudCP1OHkQ-IJCVO10DJKi8G2fLekqfpy0xAXGakQmj-7FZW3DwB18BxcHNIWlgNC9T3T1tbXEnbaxM",
            // authDomain: "<PROJECT_ID>.firebaseapp.com",
            messagingSenderId: "484918912130",
        };

        firebase.initializeApp(config);
        const messaging = firebase.messaging();

        messaging.onMessage((message) => this._onNotification(message.notification));

        messaging.onTokenRefresh(async () => {
            this._token = await messaging.getToken();
            app.emit('firebase-token-refresh', this._token);
        });

        this.askPermissionBrowser().catch(console.error);
    }

    /**
     * app (cordova + firebase)
     */
    private _loadApp() {
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