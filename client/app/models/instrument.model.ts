import {EventEmitter} from '@angular/core';
import {BaseModel} from './base.model';
import {InstrumentSettings} from '../../../shared/interfaces/InstrumentSettings';

export class InstrumentModel extends BaseModel {

	public synced = new EventEmitter();

	public data = <InstrumentSettings> {
		instrument: '',
		timeFrame: 'M15',
		id: '',
		focus: false,
		indicators: [],
		bars: [],
		live: true,
		zoom: 4,
		graphType: 'candlestick'
	};

	private _zoomMax = 10;
	private _zoomMin = 1;

	constructor(data?: InstrumentSettings) {
		super();

		if (data) {
			this.set(data);
		}
	}

	public setZoom(step) {
		if (this.data.zoom + step > this._zoomMax || this.data.zoom + step < this._zoomMin)
			return;

		this.set({zoom: this.data.zoom + step});
	}

	updateBars(bars) {
		this.data.bars = bars;
	}

	public addIndicator(indicator) {
		this.data.indicators.push(indicator);
	}

	public removeIndicator() {
		// this.data.indicators.push()
	}

	public updateIndicators(indicators) {
		indicators.forEach(indicator => {
			let existing = this.data.indicators.find(i => i === indicator.id);

			if (existing) {
				existing.data = indicator.data;
			}

			else {
				this.data.indicators.push(indicator);
			}
		});
	}
}