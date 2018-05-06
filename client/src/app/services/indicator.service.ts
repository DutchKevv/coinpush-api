import { Injectable } from "@angular/core";
import { app } from "core/app";

const SERIES_MAIN_NAME = 'main';
const SERIES_VOLUME_NAME = 'volume';

interface IIndicator {
	id: string | number;
	type: string;
	params?: any;
}

@Injectable({
	providedIn: 'root',
})
export class IndicatorService {

	private _idCounter = 0;

	public indicators: Array<IIndicator> = [];

	constructor() {
		this.init().catch(console.error);
	}

	public async init() {
		await this._loadLocal();
	}

	findById(id: string | number): IIndicator {
		return this.indicators.find(indicator => indicator.id === id);
	}

	add(type: string, options?: any): IIndicator {
		const id = type + '_' + this._idCounter++;
		let indicatorOptions: any = {};

		switch (type) {
			case 'bollingerbands':
				indicatorOptions = {
					id,
					name: 'Bollinger Bands',
					type: 'bb',
					linkedTo: SERIES_MAIN_NAME,
					params: {
						period: 20,
						standardDeviation: 2
					},
					getParamString: function () {
						return `(${this.params.period},${this.params.standardDeviation})`;
					}
				}
				break;
			case 'cci':
				indicatorOptions = {
					id,
					name: 'CCI',
					type: 'cci',
					linkedTo: SERIES_MAIN_NAME,
					yAxis: 1,
					params: {
						period: 7
					},
					getParamString: function () { }
				}
				break;
			case 'ema':
				indicatorOptions = {
					id,
					name: 'EMA',
					type: 'ema',
					linkedTo: SERIES_MAIN_NAME,
					params: {
						period: 7
					},
					getParamString: function () { }
				}
				break;
			case 'mfi':
				indicatorOptions = {
					id,
					name: 'MFI',
					type: 'mfi',
					linkedTo: SERIES_MAIN_NAME,
					params: {
						volumeSeriesID: SERIES_VOLUME_NAME
					},
					getParamString: function () { }
				}
				break;
			case 'momentum':
				indicatorOptions = {
					id,
					name: id,
					type: 'momentum',
					linkedTo: SERIES_MAIN_NAME,
					params: {
						volumeSeriesID: SERIES_VOLUME_NAME
					},
					getParamString: function () { }
				}
				break;
			case 'macd':
				indicatorOptions = {
					id,
					name: 'MACD',
					type: 'macd',
					linkedTo: SERIES_MAIN_NAME,
					params: {
						volumeSeriesID: SERIES_VOLUME_NAME
					},
					getParamString: function () { }
				}
				break;
			case 'sma':
				indicatorOptions = {
					id,
					name: 'SMA',
					type: 'sma',
					linkedTo: SERIES_MAIN_NAME,
					params: {
						period: 7
					},
					getParamString: function () { }
				}
				break;
			case 'wma':
				indicatorOptions = {
					id,
					name: id,
					type: 'wma',
					linkedTo: SERIES_MAIN_NAME,
					params: {
						period: undefined
					},
					getParamString: function () { }
				}
				break;
			case 'zigzag':
				indicatorOptions = {
					id,
					name: id,
					type: 'zigzag',
					linkedTo: SERIES_MAIN_NAME,
					params: {
						deviation: 5
					},
					getParamString: function () { }
				}
				break;
			default:
				throw new Error('uknown indicator! : ' + type);
		}

		this.indicators.push(indicatorOptions);

		this._storeLocal();

		return indicatorOptions;
	}

	remove(id: string | number) {
		this.indicators.splice(this.indicators.findIndex(indicator => indicator.id === id, 1));
		this._storeLocal();
	}

	private async _loadLocal() {
		try {
			const indicators = JSON.parse(await app.storage.get('indicators')) || [];

			// temp
			indicators.forEach(indicator => {
				indicator.getParamString = function () { }
			});

			this.indicators = indicators;

		} catch (error) {
			console.error(error);

		}
	}

	private async _storeLocal() {
		await app.storage.set('indicators', JSON.stringify(this.indicators));
	}
}