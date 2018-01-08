import { app } from '../app';

export async function loadCordova(): Promise<void> {
    if (!app.platform.isReady)
        await app.platform.isReady$;

    setAppVersion();
    setPushMessages();

    // wait until everything else is loaded before loading in advertisements (can be slow)
    // TODO: wait until angular is also ready, now only waiting for dom ready
    setTimeout(setAdvertise, 2000);
}

/**
 * advertising
 */
function setAdvertise() {
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

/**
* app version
* todo: really needed? could also make hardcoded api version
*/
function setAppVersion() {
    window['cordova'].getAppVersion.getVersionNumber().then(function (version) {
        app.platform.version = version;
    });
}

/**
* push message
*/
function setPushMessages() {
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