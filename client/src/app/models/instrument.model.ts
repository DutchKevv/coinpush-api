import {InstrumentSettings} 		from '../../../../shared/interfaces/InstrumentSettings';
import {BaseModel} 					from './base.model';

export class InstrumentModel extends BaseModel {

	public static readonly DEFAULTS: InstrumentSettings = {
		ea: null,
		symbol: null,
		timeFrame: 'M1',
		id: null,
		groupId: null,
		focus: false,
		autoRun: true,
		indicators: [],
		candles: [],
		zoom: 4,
		graphType: 'candlestick',
		orders: [],
		startEquality: 10000,
		currency: 'euro',
		leverage: 1,
		pips: 1,
		type: 'live',
		status: {
			type: 'booting',
			progress: 0,
			tickCount: 0,
			ticksPerSecond: 0,
			fetchTime: 0,
			startTime: null,
			endTime: null
		}
	};

	private _zoomMax = 10;
	private _zoomMin = 1;

	public set(obj, triggerChange = true, triggerOptions = true) {
		if (obj.orders) {
			if (obj.orders.length) {
				this.updateOrders(obj.orders);
			}
			let orders = obj.orders;
			delete obj.orders;
			super.set(obj, triggerChange, triggerOptions);
			this.changed$.next({orders});
			obj.orders = orders;
		} else {
			super.set(obj, triggerChange, triggerOptions);
		}
	}

	public setZoom(step) {
		if (this.options.zoom + step > this._zoomMax || this.options.zoom + step < this._zoomMin)
			return;

		this.set({zoom: this.options.zoom + step});
	}

	public updateCandles(candles: Array<any>) {
		this.options.candles = candles || [];
	}

	public removeIndicator() {
		// this.data.indicators.push()
	}

	public updateOrders(orders) {
		this.options.orders.push(...orders);
	}

	public updateIndicators(indicators) {
		indicators.forEach(indicator => {
			// let existing = this.options.indicators.find(i => i === indicator.id);
			//
			// if (existing) {
			// 	existing.data = indicator.data;
			// }

			// else {
				this.options.indicators.push(indicator);
			// }
		});

		if (indicators.length)
			this.changed$.next({indicator: {type: 'add', id: indicators[0].id}});
	}

	public onDestroy() {
		super.onDestroy();
	}
}