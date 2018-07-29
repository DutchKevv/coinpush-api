"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var fs = require("fs");
var UPDATE_INTERVAL = 5000;
var PATH_CONFIG = path.join(__dirname, '../../../../../_config/coinpush.config.js');
var PATH_CONFIG_CUSTOM = path.join(__dirname, '../../../../../_config/coinpush.config.custom.js');
function update() {
    try {
        var lastChangeCommon = new Date(fs.statSync(PATH_CONFIG).mtime);
        var lastChangeCustom = new Date(fs.statSync(PATH_CONFIG_CUSTOM).mtime);
        // remove previous config from cache
        delete require.cache[require.resolve(PATH_CONFIG)];
        // load config
        var newConfig = require(PATH_CONFIG).config;
        // quality check
        if (!newConfig || !Object.keys(newConfig).length)
            throw new Error('invalid config');
        // TODO - better way?
        // merge to keep object references
        Object.assign(exports.config, newConfig);
    }
    catch (error) {
        console.error(error);
    }
}
exports.config = {};
update();
setInterval(update, UPDATE_INTERVAL);
