import { app } from '../app';

export async function loadCordova(): Promise<void> {
    if (!app.platform.isReady)
        await app.platform.isReady$;

    setAppFunctions();
}

function setAppFunctions() {

    if (window['AdMob']) {

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

    window['cordova'].getAppVersion.getVersionNumber().then(function (version) {
        app.platform.version = version;
    });

    window['FirebasePlugin'].hasPermission(function (data) {
        if (!data.isEnabled)
            window['FirebasePlugin'].grantPermission();
    });

    window['FirebasePlugin'].onNotificationOpen(function (notification) {
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

    }, function (error) {
        console.error(error);
    });

    window['FirebasePlugin'].onTokenRefresh(function (token) {
        // save this server-side and use it to push notifications to this device

    }, function (error) {
        console.error(error);
    });
}

    // window.FirebasePlugin.getToken(function (token) {
    //     // save this server-side and use it to push notifications to this device
    //     console.log(token);
    // }, function (error) {
    //     console.error(error);
    // });