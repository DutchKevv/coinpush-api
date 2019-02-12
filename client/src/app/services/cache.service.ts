import { EventEmitter, Injectable } from '@angular/core';
import { SymbolModel } from "../models/symbol.model";
import { UserService } from './user.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SocketService } from './socket.service';
import { Observable, BehaviorSubject } from 'rxjs';

import { map } from 'rxjs/operators';
import { AccountService } from './account/account.service';

@Injectable({
	providedIn: 'root',
})
export class CacheService {

	public symbols: Array<SymbolModel> = [];
	public changed$: EventEmitter<Array<SymbolModel>> = new EventEmitter();
	public favoritesLength$: BehaviorSubject<number> = new BehaviorSubject(0);

	constructor(
		private _userService: UserService,
		private _socketService: SocketService,
		private _accountService: AccountService,
		private _http: HttpClient
	) { }

	public init() {
		// this._updateSymbols();

		this._socketService.socket.on('ticks', (ticks: any) => {
			const changedModels = [];

			for (let symbolName in ticks) {
				const symbolModel = this.getSymbolByName(symbolName);

				if (symbolModel) {
					symbolModel.tick(ticks[symbolName]);
					changedModels.push(symbolModel);
				} else {
					// console.warn('onTick - symbol not found : ' + symbolName);
				}
			}

			this.changed$.next(changedModels);
		});
	}

	/**
	 * 
	 * @param params 
	 */
	public read(params: any): Observable<any> {
		return this._http.get('/cache', { params: new HttpParams({ fromObject: params }) });
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

	/**
	 * 
	 * @param symbol 
	 */
	public async toggleFavoriteSymbol(symbol: SymbolModel): Promise<boolean> {
		try {
			const result = await this._http.post('/favorite', {
				symbol: symbol.options.name,
				state: !symbol.options.iFavorite
			}, { responseType: "text" }).toPromise();

			symbol.options.iFavorite = !symbol.options.iFavorite;

			this.favoritesLength$.next(this.symbols.filter(symbolModel => symbolModel.options.iFavorite).length);

			return true;
		} catch (error) {
			symbol.options.iFavorite = !symbol.options.iFavorite;

			this.favoritesLength$.next(this.symbols.filter(symbolModel => symbolModel.options.iFavorite).length);

			console.error(error);
			return false;
		}
	}

	public setSymbols(symbols: any[]) {
		const account =  this._accountService.account$.getValue();

		for (let key in symbols) {
			const symbol = JSON.parse(symbols[key]);
			const storedSymbol = this.getSymbolByName(symbol.name);
			
			symbol.iFavorite = account.favorites.includes(symbol.name);

			// update
			if (storedSymbol)
				Object.assign(storedSymbol.options, symbol);

			// create
			else
				this.symbols.push(new SymbolModel(symbol));
		}

		this.favoritesLength$.next(this.symbols.filter(symbolModel => symbolModel.options.iFavorite).length);
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