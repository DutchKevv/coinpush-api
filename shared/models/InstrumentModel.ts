import {InstrumentSettings} from '../interfaces/InstrumentSettings';
import {BaseModel} from '../models/BaseModel';
import * as moment from 'moment';

export class InstrumentModel extends BaseModel {

	public static readonly DEFAULTS: InstrumentSettings = {
		ea: '',
		symbol: '',
		timeFrame: 'M15',
		id: '',
		groupId: 0,
		focus: false,
		autoRun: true,
		indicators: [],
		bars: [],
		live: true,
		zoom: 4,
		graphType: 'candlestick',
		orders: [],
		startEquality: 10000,
		currency: 'euro',
		leverage: 1,
		pips: 1
	};

	public static parseUnixToString(date: number): string {
		if (typeof date === 'number')
			return moment(date).format('YYYY-MM-DD');

		return date;
	}

	public static parseDateStringToUnix(date: string) {
		if (typeof date === 'string')
			return moment(date, 'YYYY-MM-DD').valueOf();
		return date;
	}

	private _zoomMax = 10;
	private _zoomMin = 1;

	public setZoom(step) {
		if (this.options.zoom + step > this._zoomMax || this.options.zoom + step < this._zoomMin)
			return;

		this.set({zoom: this.options.zoom + step});
	}

	public updateBars(bars) {
		this.options.bars = bars;
	}

	public addIndicator(indicator) {
		this.options.indicators.push(indicator);
	}

	public removeIndicator() {
		// this.data.indicators.push()
	}

	public updateOrders() {

	}

	public updateIndicators(indicators) {
		indicators.forEach(indicator => {
			let existing = this.options.indicators.find(i => i === indicator.id);

			if (existing) {
				existing.data = indicator.data;
			}

			else {
				this.options.indicators.push(indicator);
			}
		});
	}

}