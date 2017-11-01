import {EventEmitter, Injectable, NgZone, Output} from '@angular/core';
import * as io from 'socket.io-client';
import {SymbolModel} from "../models/symbol.model";

@Injectable()
export class CacheService {

	@Output() public changed$: EventEmitter<any[]> = new EventEmitter();
	@Output() public symbols: Array<SymbolModel> = [];

	private _socket: any;

	constructor(private _zone: NgZone) {
	}


	public read(params) {
		return new Promise((resolve, reject) => {
			this._socket.emit('read', params, (err, buffer: Uint8Array) => {
				if (err)
					return reject(err);

				let arr = new Float64Array(buffer);

				resolve(arr);
			});
		})
	}

	public toggleAlarm(symbol: SymbolModel) {

	}

	public load(unload = true) {
		return new Promise((resolve, reject) => {

			if (unload)
				this.unload();

			this._connect();

			this._socket.emit('symbol:list', {}, (err, symbols) => {
				if (err)
					return reject(err);

				this._updateSymbols(symbols);

				resolve();
			});

			this._socket.on('ticks', ticks => {

				for (let _symbol in ticks) {
					let symbol = this.getBySymbol(_symbol);

					if (symbol)
						symbol.tick(ticks[_symbol]);
				}

				this.changed$.next(Object.keys(ticks));
			});
		});

	}

	public unload() {
		this._disconnect();
		// this.symbolList$.next([]);
	}

	private _connect() {

		// this._zone.runOutsideAngular(() => {
			this._socket = io('/', {
				'reconnectionAttempts': 10, // avoid having user reconnect manually in order to prevent dead clients after a server restart
				'timeout': 10000, // before connect_error and connect_timeout are emitted.
				'transports': ['websocket'],
				path: '/ws/candles/'
			});
		// });
	}

	private _disconnect() {
		// this._socket.destroy();
	}

	private _updateSymbols(symbols) {

		const models = symbols.map(symbol => new SymbolModel({
			// direction: 'up',
			// name: symbol.name,
			// bidDirection: 'up',
			// bid: symbol.bid,
			// ask: symbol.ask,
			// askDirection: 'up',
			// favorite: symbol.favorite,
			...symbol
		}));

		this.symbols = models;

		// this.symbolList$.next(models);
	}

	public add(model) {
		return model;
	}

	public getBySymbol(symbol: string) {
		return this.symbols.find(_symbol => _symbol.options.name === symbol)
	}

	public getByText(text: string) {
		text = text.trim().toLowerCase();
		const regex = new RegExp(text, 'i');
		return this.symbols.filter(symbol => symbol.options.name.toLowerCase().indexOf(text) > -1);
	}
}