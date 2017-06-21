import {Injectable, NgZone, Output} from '@angular/core';
import {SocketService} from './socket.service';
import {BehaviorSubject} from 'rxjs';
import CacheMap from '../../../shared/classes/cache/CacheMap';
import {SystemState} from '../../../shared/models/SystemState';
import {Base} from '../../../shared/classes/Base';
import * as io from 'socket.io-client';
import {Subject} from 'rxjs/Subject';

export class CacheSymbol extends Base {
	public price$: Subject<any> = new Subject();

	public tick(ticks) {
		ticks.forEach(tick => {
			let data = {
				direction: this.options.bid > tick[2] ? 'down' : 'up',
				bidDirection: this.options.bid > tick[2] ? 'down' : 'up',
				bid: tick[1],
				askDirection: this.options.ask > tick[2] ? 'down' : 'up',
				ask: tick[2]
			};

			this.set(data, false);
		});

		this.price$.next(true);
	}
}

@Injectable()
export class CacheService {

	@Output() public symbolList$: BehaviorSubject<Array<CacheSymbol>> = new BehaviorSubject([]);
	@Output() public changed$: Subject<any> = new Subject();

	private _mapper: CacheMap;
	private _socket: any;

	constructor(private _zone: NgZone,
				private _socketService: SocketService) {
	}

	public init(): void {
		this._mapper = new CacheMap();
		this._connect();

		this._loadSymbolList();

		this._socketService.socket.on('system:state', (systemState: SystemState) => {
			if (!systemState.booting && systemState.connected) {
				this._loadSymbolList();
			}
		});

		this._socketService.socket.on('ticks', (ticks) => {

			this._zone.runOutsideAngular(() => {
				for (let _symbol in ticks) {

					let symbol = this.getBySymbol(_symbol);

					if (symbol)
						symbol.tick(ticks[_symbol]);
				}

				this.changed$.next(Object.keys(ticks));
			});
		});
	}

	public read(params) {
		return new Promise((resolve, reject) => {
			this._socket.emit('read', params, (err, buffer) => {
				if (err)
					return reject(err);

				resolve(new Float64Array(buffer));
			});
			// $.get('http://localhost:3001/read', params).done(candles => {
			// 	resolve(candles);
			// }).fail(error => {
			// 	console.log(error);
			// 	alert('EROROROROR' + JSON.stringify(error));
			// 	reject(error);
			// })
			// let oReq = new XMLHttpRequest();
			// oReq.open('GET', 'http://localhost:3001/read/' + $.param(params), true);
			// // oReq.responseType = "arraybuffer";
			// oReq.responseType = "json";
			// // oReq.setRequestHeader('Content-Type', 'application/octet-stream');
			// oReq.onload = function(oEvent) {
			// 	let arrayBuffer = oReq.response;
			// 	console.log(arrayBuffer);
			// 	console.log('asfassdfsdf', new Float64Array(arrayBuffer));
			// 	// // if you want to access the bytes:
			// 	// var byteArray = new Uint8Array(arrayBuffer);
			// 	// ...
			//
			// 	// // If you want to use the image in your DOM:
			// 	// var blob = new Blob(arrayBuffer, {type: "image/png"});
			//
			// 	// whatever...
			// };
			//
			// oReq.send();

			// $.get('http://localhost:3001/read', params).done(function(data) {
			// 	console.log('asfsdafdsf', arguments);
			// 	resolve(data)
			// }).fail(reject);
		})
	}

	private _connect() {
		this._socket = io(this._getUrl(), {
			"reconnectionAttempts": 10, //avoid having user reconnect manually in order to prevent dead clients after a server restart
			"timeout" : 10000, //before connect_error and connect_timeout are emitted.
			"transports" : ["websocket"]
		});
	}

	private _getUrl(): string {
		// Electron
		if (window.location.protocol === 'file:') {
			return 'http://localhost:3001';

			// Browser | external
		} else {
			return window.location.hostname + ':3001';
		}
	}

	private _loadSymbolList() {
		this._socketService.send('cache:symbol:list', {}, (err, symbolList) => {
			if (err)
				return console.error(err);

			// Create symbol class for each symbol
			let cacheSymbols = symbolList.map(symbol => {
				return new CacheSymbol({
					direction: 'up',
					name: symbol.name,
					bidDirection: 'up',
					bid: symbol.bid,
					ask: symbol.ask,
					askDirection: 'up'
				});
			});

			this.symbolList$.next(cacheSymbols);
		});
	}

	public add(model) {
		return model;
	}

	public getBySymbol(symbol: string) {
		return this.symbolList$.getValue().find(_symbol => _symbol.options.name === symbol)
	}
}