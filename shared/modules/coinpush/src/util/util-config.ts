import * as path from 'path';
import * as fs from 'fs';
import * as log from './util.log';

const UPDATE_INTERVAL = 5000;
const PATH_CONFIG = path.join(__dirname, '../../../../../_config/coinpush.config.js');

function update() {
    try {
        const lastChangeCommon = new Date(fs.statSync(PATH_CONFIG).mtime)

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

export class ConfigHandler {

    config: any = {};

    private _intervalHandle: any;

    startPolling(url: string = PATH_CONFIG) {
        this._intervalHandle = setInterval(this._update.bind(this), UPDATE_INTERVAL);
    }

    stopPolling() {
        clearInterval(this._intervalHandle);
    }

    private _update() {
        try {
            const lastChangeCommon = new Date(fs.statSync(PATH_CONFIG).mtime)
    
            // remove previous config from cache
            delete require.cache[require.resolve(PATH_CONFIG)]
    
            // load config
            const newConfig = require(PATH_CONFIG).config;
    
            // quality check
            if (!newConfig || !Object.keys(newConfig).length)
               throw new Error('invalid config');
    
            // TODO - better way?
            // merge to keep object references
            Object.assign(this.config, newConfig);
        } catch (error) {
            console.error(error);
        }
    }
}

export const config:any = {};

update();
