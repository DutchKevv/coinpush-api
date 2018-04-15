cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
  {
    "id": "cordova-plugin-admobpro.AdMob",
    "file": "plugins/cordova-plugin-admobpro/www/AdMob.js",
    "pluginId": "cordova-plugin-admobpro",
    "clobbers": [
      "window.AdMob"
    ]
  },
  {
    "id": "cordova-plugin-fileopener.FileOpener",
    "file": "plugins/cordova-plugin-fileopener/www/FileOpener.js",
    "pluginId": "cordova-plugin-fileopener",
    "clobbers": [
      "cordova.plugins.FileOpener"
    ]
  },
  {
    "id": "cordova-plugin-badge.Badge",
    "file": "plugins/cordova-plugin-badge/www/badge.js",
    "pluginId": "cordova-plugin-badge",
    "clobbers": [
      "cordova.plugins.notification.badge"
    ]
  },
  {
    "id": "cordova-plugin-inappbrowser.inappbrowser",
    "file": "plugins/cordova-plugin-inappbrowser/www/inappbrowser.js",
    "pluginId": "cordova-plugin-inappbrowser",
    "clobbers": [
      "cordova.InAppBrowser.open",
      "window.open"
    ]
  },
  {
    "id": "cordova-plugin-facebook4.FacebookConnectPlugin",
    "file": "plugins/cordova-plugin-facebook4/www/facebook-native.js",
    "pluginId": "cordova-plugin-facebook4",
    "clobbers": [
      "facebookConnectPlugin"
    ]
  },
  {
    "id": "cordova-plugin-firebase-messaging.FirebaseMessaging",
    "file": "plugins/cordova-plugin-firebase-messaging/www/FirebaseMessaging.js",
    "pluginId": "cordova-plugin-firebase-messaging",
    "merges": [
      "cordova.plugins.firebase.messaging"
    ]
  },
  {
    "id": "phonegap-plugin-push.PushNotification",
    "file": "plugins/phonegap-plugin-push/www/push.js",
    "pluginId": "phonegap-plugin-push",
    "clobbers": [
      "PushNotification"
    ]
  }
];
module.exports.metadata = 
// TOP OF METADATA
{
  "cordova-plugin-whitelist": "1.3.3",
  "cordova-plugin-extension": "1.5.4",
  "cordova-plugin-admobpro": "2.31.4",
  "cordova-plugin-fileopener": "1.0.5",
  "cordova-plugin-badge": "0.8.7",
  "cordova-plugin-inappbrowser": "2.0.2",
  "cordova-plugin-facebook4": "1.10.1",
  "cordova-support-google-services": "1.1.0",
  "cordova-plugin-firebase-messaging": "0.13.0",
  "phonegap-plugin-push": "2.2.2"
};
// BOTTOM OF METADATA
});