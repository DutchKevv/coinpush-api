
import { pubClient, subClient } from 'coinpush/redis';
import { EventEmitter } from 'events';

const SYMBOL_INTERVAL = 10000;

export class SymbolSyncer extends EventEmitter {

    private _symbols = [];
    private _syncInterval = null;

    get symbols() {
        return this._symbols;
    }

    async onTick(tick: any) {

    }

    public sync(): Promise<void> {
        return new Promise((resolve, reject) => {
            pubClient.hgetall('symbols', (err, symbols: any) => {
                if (err) {
                    this.emit('error', err);
                    return reject(err);
                }

                // can be empty when having cache problems
                if (symbols && Object.keys(symbols).length) {
                    this._symbols = symbols;
                } else {
                    console.warn('EMPTY SYMBOL SET RECEIVED FROM REDIS!');
                }

                this.emit('synced');

                resolve();
            });
        });
    }

    public startSyncInterval() {
        this._syncInterval = setInterval(() => this.sync().catch(console.error), SYMBOL_INTERVAL);
    }

    public stopSyncInterval() {
        clearInterval(this._syncInterval);
        this._syncInterval = null;
    }
}