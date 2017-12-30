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

    private _onNotification(notification: any) {
        alert('MESSAGE!@!' + notification);

        notification.body = JSON.parse(notification.body);

        switch (notification.body.type) {
            case 'post-comment':
                window.location.hash = '#/comment/' + notification.body.parentId + '?focus=' + notification.body.commentId;
                break;
            case 'post-like':
                window.location.hash = '#/comment/' + notification.body.commentId;
                break;
            case 'comment-like':
                window.location.hash = '#/comment/' + notification.body.parentId + '?focus=' + notification.body.commentId;
                break
        }
    }

    /**
     * browser (firebase)
     */
    private async _loadBrowser() {
        const config = {
            apiKey: "AIzaSyBH22KVK0RDtxr1XuYPeQm1z5HamE-iV64",
            authDomain: "<PROJECT_ID>.firebaseapp.com",
            messagingSenderId: "<SENDER_ID>",
        };

        firebase.initializeApp(config);
        const messaging = firebase.messaging();

        messaging.onMessage((message) => this._onNotification(message));

        messaging.onTokenRefresh(async () => {
            this._token = await messaging.getToken();
            app.emit('firebase-token-refresh', this._token);
        });

        await this.askPermissionBrowser();
    }

    /**
     * app (cordova + firebase)
     */
    private _loadApp() {
        FirebasePlugin.hasPermission((data) => {
            if (!data.isEnabled)
                FirebasePlugin.grantPermission((result) => {
                    FirebasePlugin.getToken(token => {
                        alert(token);
                        this._token = token;
                    });
                });
            else {
                FirebasePlugin.getToken(token => {
                    alert(token);
                    this._token = token;
                });
            }
        });

        FirebasePlugin.onNotificationOpen(notification => this._onNotification(notification), function (error) {
            throw error;
        });

        FirebasePlugin.onTokenRefresh(function (token) {
            // save this server-side and use it to push notifications to this device

        }, function (error) {
            console.error(error);
        });
    }
}