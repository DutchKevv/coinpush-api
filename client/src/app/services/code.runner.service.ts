import { Injectable } from '@angular/core';
import { CacheService } from './cache.service';

@Injectable()
export class WebworkerService {
    constructor(private _cacheService: CacheService) { }

    public run(files: Array<string>): Array<any> {
        return [];
    }

    private workers: Worker[] = [];

    private getWorker() {
        if (this.workers.length === 0) {
            this.workers.push(new Worker("assets/custom/js/workers/ea.worker.js"));
        }

        return this.workers[0];
    }

    public killWorker() {
        this.workers[0].terminate();
        this.workers = [];
    }

    public evalAsync(script: string, timeout = 1000): Promise<string> {
        let worker = this.getWorker();

        return new Promise((resolve, reject) => {
            // Handle timeout
            let handle = setTimeout(() => {
                this.killWorker();
                reject("timeout");
            }, timeout);

            // Send the script to eval to the worker
            worker.postMessage(['EUR_USD', script]);
          
            setTimeout(() => {
                worker.postMessage(['run', {}]);
            }, 1000);

            // Handle result
            worker.onmessage = async e => {
                clearTimeout(handle);

                if (!e.data)
                    return;

                switch (e.data[0]) {
                    case 'get-candles':
                        const candles = await this._cacheService.read({
                            symbol: 'EUR_USD',
                            timeFrame: 'M15'
                        });
                        console.log('sadf', candles);
                        
                        worker.postMessage(['get-candles', candles]);
                        break;
                }
                console.log(e.data);
            };

            worker.onerror = e => {
                clearTimeout(handle);
                reject((e as any).message);
            }

            resolve('');
        });
    }
}