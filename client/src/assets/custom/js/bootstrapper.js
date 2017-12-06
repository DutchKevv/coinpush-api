(() => {

    class MicroEvent {
        on(event, fct) {
            this._events = this._events || {};
            this._events[event] = this._events[event] || [];
            this._events[event].push(fct);
        }
        off(event, fct) {
            this._events = this._events || {};
            if (event in this._events === false) return;
            this._events[event].splice(this._events[event].indexOf(fct), 1);
        }
        emit(event /* , args... */) {
            this._events = this._events || {};
            if (event in this._events === false) return;
            for (var i = 0; i < this._events[event].length; i++) {
                this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        }
    };

    class App extends MicroEvent {

        constructor() {
            super();

            this.version = null;

            this._setPlatformData();
        }

        init() {

        }

        _setPlatformData() {
            this.platform = {
                isApp: !!window['_cordovaNative'],
                isEmulator: navigator.platform === 'Linux i686',
                isLocal: document.URL.indexOf('file://') > -1
            };
        }
    }

    const app = window.app = new App();

    // load cordova before app starts
    if (app.platform.isApp) {
        var script = document.createElement('script');
        script.src = 'cordova.js';
        document.head.appendChild(script); //or something of the likes

        function onDeviceReady() {
            var admobid = {};
            if (/(android)/i.test(navigator.userAgent)) { // for android & amazon-fireos
                admobid = {
                    banner: 'ca-app-pub-1181429338292864/7213864636',
                    interstitial: 'ca-app-pub-1181429338292864/7213864636'
                };
            } else if (/(ipod|iphone|ipad)/i.test(navigator.userAgent)) { // for ios
                admobid = {
                    banner: 'ca-app-pub-1181429338292864/7213864636',
                    interstitial: 'ca-app-pub-1181429338292864/7213864636'
                };
            } else { // for windows phone
                admobid = {
                    banner: 'ca-app-pub-1181429338292864/7213864636',
                    interstitial: 'ca-app-pub-1181429338292864/7213864636'
                };
            }

            if (window.AdMob) {
                window.AdMob.createBanner({
                    adSize: 'BANNER',
                    overlap: true,
                    height: 60, // valid when set adSize 'CUSTOM'
                    adId: admobid.banner,
                    position: window.AdMob.AD_POSITION.BOTTOM_CENTER,
                    autoShow: true,
                    isTesting: true
                });

                // window.AdMob.showBannerAtXY(0, window.innerHeight - 50)
            }

            cordova.getAppVersion.getVersionNumber().then(function (version) {
                app.version = version;
            });

            window.FirebasePlugin.hasPermission(function (data) {
                if (!data.isEnabled)
                    window.FirebasePlugin.grantPermission();
            });

            window.FirebasePlugin.onNotificationOpen(function (notification) {
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

            window.FirebasePlugin.onTokenRefresh(function (token) {
                // save this server-side and use it to push notifications to this device

            }, function (error) {
                console.error(error);
            });


        }

        document.addEventListener("deviceready", (onDeviceReady), false);

        app.init();
        // window.FirebasePlugin.getToken(function (token) {
        //     // save this server-side and use it to push notifications to this device
        //     console.log(token);
        // }, function (error) {
        //     console.error(error);
        // });
    }
})();