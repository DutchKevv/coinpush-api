import { BaseModel } from "./base.model";
import { Subject } from "rxjs/Subject";
import { Observable } from "rxjs/Observable";

export class SymbolModel {

	public price$: Observable<any> = new Observable();

	constructor(public options) {

	}

	public tick(ticks) {

		ticks.forEach(tick => {
			this.options.bid = tick[1];

			if (tick[1] > this.options.high)
				this.options.high = tick[1];

			else if (tick[1] < this.options.low)
				this.options.low = tick[1];
		});

		this._updateChangedAmount();

		// this.price$.
	}

	private _updateChangedAmount() {
		if (!this.options.marks)
			return console.warn('Symbol ' + this.options.name + ' is incomplete');

		const startHPrice = this.options.marks.H.price;
		const startDPrice = this.options.marks.D.price;
		const nowPrice = this.options.bid;

		const percH = Number(((nowPrice - startHPrice) / startHPrice * 100).toFixed(2));
		const percD = Number(((nowPrice - startDPrice) / startDPrice * 100).toFixed(2));

		// Only update if changed
		if (this.options.changedHAmount !== percH)
			this.options.changedHAmount = percH;

		if (this.options.changedDAmount !== percD)
			this.options.changedDAmount = percD;
	}

	/**
	 * TEMP!! to fix AOT
	 */
	setZoom(step: Number) {

	}
}