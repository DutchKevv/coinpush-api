
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

    async start() {
        await this._loadSymbols();

        subClient.subscribe("symbol-update");
        subClient.subscribe("ticks");

        subClient.on("message", this._onMessage.bind(this));
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

    private _onMessage(channel, message) {
        let data;

        try {
            data = JSON.parse(message);
        } catch (error) {
            return console.error(error);
        }
    
        switch (channel) {
            case 'symbol-update':
                console.log(data);
            case 'ticks':
                this.emit('ticks', data);
                break;
            case 'bar':
                break;
        }
    }
}