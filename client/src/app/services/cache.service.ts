import { EventEmitter, Injectable, NgZone, Output } from '@angular/core';
import { SymbolModel } from "../models/symbol.model";
import { UserService } from './user.service';
import { app } from '../../core/app';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SocketService } from './socket.service';

@Injectable()
export class CacheService {

	@Output() public changed$: EventEmitter<any[]> = new EventEmitter();
	@Output() public symbols: Array<SymbolModel> = [];

	constructor(
		private _zone: NgZone,
		private _userService: UserService,
		private _socketService: SocketService,
		private _http: HttpClient
	) {}

	public init() {
		this._updateSymbols();

		app.on('symbols-update', () => this._updateSymbols());

		this._socketService.socket.on('ticks', ticks => {
			for (let _symbol in ticks) {
				let symbol = this.getSymbolByName(_symbol);

				if (symbol)
					symbol.tick([ticks[_symbol]]);
			}

			this.changed$.next(Object.keys(ticks));
		});
	}

	public async read(params: any) {
		params = new HttpParams({
			fromObject: params
		});

		return this._http.get('/cache', {
			responseType: "arraybuffer",
			params
		})
			.map(res => new Float64Array(res))
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