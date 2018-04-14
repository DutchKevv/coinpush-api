cordova.define("cordova-plugin-fileopener.FileOpener", function(require, exports, module) {
var exec = require('cordova/exec');

exports.canOpenFile = function (fileURL, success, error) {
    exec(success, error, "FileOpener", "canOpenFile", [fileURL]);
};

exports.openFile = function (fileURL, success, error) {
    exec(success, error, "FileOpener", "openFile", [fileURL]);
};


});
