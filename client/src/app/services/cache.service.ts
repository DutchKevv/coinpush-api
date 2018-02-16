import { EventEmitter, Injectable, NgZone, Output } from '@angular/core';
import * as io from 'socket.io-client';
import { SymbolModel } from "../models/symbol.model";
import { UserService } from './user.service';
import { app } from '../../core/app';
import { Http, Response, ResponseContentType } from '@angular/http';

@Injectable()
export class CacheService {

	@Output() public changed$: EventEmitter<any[]> = new EventEmitter();
	@Output() public symbols: Array<SymbolModel> = [];

	private _socket: any;

	constructor(
		private _zone: NgZone,
		private _userService: UserService,
		private _http: Http
	) {

	}

	public init() {
		this._socket = io(app.address.host + '://' + app.address.ip + (app.address.port ? ':' + app.address.port : ''), {
			reconnectionAttempts: 10000, // avoid having user reconnect manually in order to prevent dead clients after a server restart
			timeout: 10000, // before connect_error and connect_timeout are emitted.
			transports: ['websocket'],
			query: 'userId=' + this._userService.model.options._id,
			secure: true,
			autoConnect: false
		});

		this._updateSymbols();

		app.on('symbols-update', () => this._updateSymbols());

		this._socket.on('notification', notification => {
			alert('notificaoitn!!!');
		})

		this._socket.on('ticks', ticks => {
			for (let _symbol in ticks) {
				let symbol = this.getSymbolByName(_symbol);

				if (symbol)
					symbol.tick([ticks[_symbol]]);
			}

			this.changed$.next(Object.keys(ticks));
		});
	}

	public async read(params) {
		const headers = new Headers;
		headers.append('Content-Type', 'application/octet-stream');

		return (<any>this._http).get('/cache', {
			headers,
			params,
			responseType: ResponseContentType.ArrayBuffer
		})
			.map(res => new Float64Array(res._body))
			.toPromise();
	}

	/**
	 * ensure number is x digits long
	 * @param number 
	 * @param symbol 
	 */
	public priceToFixed(number: number | string, symbol: SymbolModel): string {
		if (typeof number === 'string')
			number = parseFloat(number);

		return number.toPrecision(8);
	}

	public connect() {
		this._socket.open();
	}

	public disconnect() {
		this._socket.close();
	}

	private _updateSymbols() {

		this._zone.runOutsideAngular(() => {

			for (let key in app.data.symbols) {
				const symbol = JSON.parse(app.data.symbols[key]);

				const storedSymbol = this.getSymbolByName(symbol.name);

				if (storedSymbol) {

					Object.assign(storedSymbol.options, symbol);

				} else {
					symbol.iFavorite = this._userService.model.options.favorites.includes(symbol.name);

					const symbolModel = new SymbolModel(symbol);
					symbolModel.tick([]);
					this.symbols.push(symbolModel);
				}
			}

			delete app.data.symbols;
		});

		console.log(this.symbols)
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