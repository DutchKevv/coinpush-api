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
    "id": "cordova-plugin-firebase.FirebasePlugin",
    "file": "plugins/cordova-plugin-firebase/www/firebase.js",
    "pluginId": "cordova-plugin-firebase",
    "clobbers": [
      "FirebasePlugin"
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
  }
];
module.exports.metadata = 
// TOP OF METADATA
{
  "cordova-plugin-whitelist": "1.3.3",
  "cordova-plugin-extension": "1.5.4",
  "cordova-plugin-admobpro": "2.31.1",
  "cordova-plugin-firebase": "0.1.25",
  "cordova-plugin-fileopener": "1.0.5",
  "cordova-plugin-badge": "0.8.7"
};
// BOTTOM OF METADATA
});