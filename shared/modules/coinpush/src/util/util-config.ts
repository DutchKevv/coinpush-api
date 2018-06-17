import * as path from 'path';
import * as fs from 'fs';
import * as log from './util.log';

const UPDATE_INTERVAL = 5000;
const PATH_CONFIG = path.join(__dirname, '../../../../../_config/coinpush.config.js');
const PATH_CONFIG_CUSTOM = path.join(__dirname, '../../../../../_config/coinpush.config.custom.js');

function update() {
    try {
        const lastChangeCommon = new Date(fs.statSync(PATH_CONFIG).mtime);
        const lastChangeCustom = new Date(fs.statSync(PATH_CONFIG_CUSTOM).mtime);

        // remove previous config from cache
        delete require.cache[require.resolve(PATH_CONFIG)]

        // load config
        const newConfig = require(PATH_CONFIG).config;

        // quality check
        if (!newConfig || !Object.keys(newConfig).length)
           throw new Error('invalid config');

        // TODO - better way?
        // merge to keep object references
        Object.assign(config, newConfig);
    } catch (error) {
        console.error(error);
    }
}

export const config:any = {};

update();
setInterval(update, UPDATE_INTERVAL);