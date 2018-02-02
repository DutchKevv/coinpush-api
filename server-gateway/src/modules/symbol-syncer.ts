
import { pubClient, subClient } from './redis';
import { EventEmitter } from 'events';

export class SymbolSyncer extends EventEmitter {

    private _symbols = [];

    get symbols() {
        return this._symbols;
    }

    constructor() {
        super();
    }

    async tick() {

    }

    async load() {
        await this._loadSymbols();
    }

    stop() {
        // subClient.off('message', this._onMessage);
    }

    private _loadSymbols(): Promise<void> {
        return new Promise((resolve, reject) => {
            pubClient.hgetall('symbols', (err, redisSymbols) => {
                if (err)
                    return reject(err);

                this._symbols = redisSymbols;

                resolve();
            });
        });
    }
}