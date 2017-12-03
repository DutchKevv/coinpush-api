import { BaseModel } from "./base.model";
import { Subject } from "rxjs/Subject";
import { Observable } from "rxjs/Observable";

export class SymbolModel {

	public price$: Observable<any> = new Observable();

	constructor(public options) {

	}

	public tick(ticks) {

		ticks.forEach(tick => {
			this.options.direction = this.options.bid > tick[1] ? 'down' : 'up';
			this.options.bidDirection = this.options.bid > tick[1] ? 'down' : 'up';
			this.options.askDirection = this.options.ask > tick[2] ? 'down' : 'up';
			this.options.bid = tick[1];
			this.options.ask = tick[2];

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

		const startPrice = this.options.marks.D.price;
		const nowPrice = this.options.bid;

		const perc = Number(((nowPrice - startPrice) / startPrice * 100).toFixed(2));

		// Only update if changed
		if (this.options.changedAmount !== perc)
			this.options.changedAmount = perc;
	}

	/**
	 * TEMP!! to fix AOT
	 */
	setZoom(step: Number) {

	}
}