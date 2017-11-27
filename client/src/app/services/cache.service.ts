import {EventEmitter, Injectable, NgZone, Output} from '@angular/core';
import * as io from 'socket.io-client';
import {SymbolModel} from "../models/symbol.model";
import { appConfig } from '../app.config';

@Injectable()
export class CacheService {

	@Output() public changed$: EventEmitter<any[]> = new EventEmitter();
	@Output() public symbols: Array<SymbolModel> = [];

	private _socket: any;

	constructor(private _zone: NgZone) {
		this._connect();
	}

	public read(params) {
		console.log('asdf',params);
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
		const start = Date.now();

		return new Promise((resolve, reject) => {

			if (unload)
				this.unload();

			console.log('beforeEmit', (Date.now() - start) / 1000);

			this._socket.emit('symbol:list', {}, (err, symbols) => {
				if (err)
					return reject(err);

				console.log('received', (Date.now() - start) / 1000);

				this._updateSymbols(symbols);

				console.log('symbolsSets', (Date.now() - start) / 1000);

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

		this._zone.runOutsideAngular(() => {
			this._socket = io(appConfig.ip + ':' + appConfig.port, {
				'reconnectionAttempts': 10, // avoid having user reconnect manually in order to prevent dead clients after a server restart
				'timeout': 10000, // before connect_error and connect_timeout are emitted.
				'transports': ['websocket'],
				path: '/ws/candles/'
			});
		});
	}

	private _disconnect() {
		// this._socket.destroy();
	}

	private _updateSymbols(symbols) {
		this.symbols = symbols.map(symbol => new SymbolModel(symbol));

		this.symbols.forEach((symbol: SymbolModel) => {
			symbol.tick([]);
		});
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