import { EventEmitter, Injectable, NgZone, Output } from '@angular/core';
import * as io from 'socket.io-client';
import { SymbolModel } from "../models/symbol.model";
import { UserService } from './user.service';
import { app } from '../../core/app';

@Injectable()
export class CacheService {

	@Output() public changed$: EventEmitter<any[]> = new EventEmitter();
	@Output() public symbols: Array<SymbolModel> = [];

	private _socket: any;

	constructor(
		private _zone: NgZone,
		private _userService: UserService
	) { 
		this.init();
	}

	init() {
		this._connect();
		this._updateSymbols();

		app.on('symbols-update', () => this._updateSymbols());

		this._socket.on('ticks', ticks => {

			for (let _symbol in ticks) {
				let symbol = this.getSymbolByName(_symbol);

				if (symbol)
					symbol.tick([ticks[_symbol]]);
			}

			this.changed$.next(Object.keys(ticks));
		});
	}

	public read(params) {

		return new Promise((resolve, reject) => {
			this._zone.runOutsideAngular(() => {
				this._socket.emit('read', params, (err, buffer: Uint8Array) => {
					if (err)
						return reject(err);

					let arr = new Float64Array(buffer);

					resolve(arr);
				});
			});
		})
	}

	public priceToFixed(number, symbol: SymbolModel) {
		if (symbol.options.precision > 0)
			return number.toFixed(symbol.options.precision + 1 || 4);

		let n = Math.max(Math.min(number.toString().length, 2), 6);
		return number.toFixed(n);
	}

	public unload() {
		this._disconnect();
		// this.symbolList$.next([]);
	}

	private _connect() {

		this._zone.runOutsideAngular(() => {
			this._socket = io('http://' + app.address.ip + ':' + app.address.port, {
				'reconnectionAttempts': 10000, // avoid having user reconnect manually in order to prevent dead clients after a server restart
				'timeout': 10000, // before connect_error and connect_timeout are emitted.
				'transports': ['websocket'],
				path: '/ws/candles/'
			});
		});
	}

	private _disconnect() {
		// this._socket.destroy();
	}

	private _updateSymbols() {

		this._zone.runOutsideAngular(() => {

			app.symbols.forEach(symbol => {

				const storedSymbol = this.getSymbolByName(symbol.name);

				if (storedSymbol) {

					Object.assign(storedSymbol.options, symbol);

				} else {
					symbol.iFavorite = this._userService.model.options.favorites.includes(symbol.name);

					const symbolModel = new SymbolModel(symbol);
					symbolModel.tick([]);
					this.symbols.push(symbolModel);
				}
			});
		});
	}

	public add(model) {
		return model;
	}

	public getSymbolByName(symbolName: string): SymbolModel {
		return this.symbols.find(_symbol => _symbol.options.name === symbolName)
	}

	public getByText(text: string) {
		text = text.trim().toLowerCase();
		return this.symbols.filter(symbol => symbol.options.name.toLowerCase().indexOf(text) > -1 || symbol.options.displayName.toLowerCase().indexOf(text) > -1);
	}
}