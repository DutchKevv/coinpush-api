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

	constructor(data?: any) {
		super();

		this.set(data);
	}

	public setZoom(step) {
		if (this.data.zoom + step > this._zoomMax || this.data.zoom + step < this._zoomMin)
			return;

		this.set({zoom: this.data.zoom + step});

	}

	updateBars(bars) {
		this.data.bars = bars;
	}

	updateIndicators(data) {

	}
}