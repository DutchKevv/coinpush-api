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

			if (tick[1] > this.options.highD)
				this.options.highD = tick[1];

			else if (tick[1] < this.options.lowD)
				this.options.lowD = tick[1];
		});

		this._updateChangedAmount();
	}

	private _updateChangedAmount() {
		if (!this.options.marks.H)
			return console.warn('Symbol ' + this.options.name + ' is incomplete');

		const startHPrice = this.options.marks.H.price;
		const startDPrice = this.options.marks.D.price;

		;
		this.options.changedHAmount = Number(((this.options.bid - startHPrice) / startHPrice * 100).toFixed(2));
		this.options.changedDAmount = Number(((this.options.bid - startDPrice) / startDPrice * 100).toFixed(2));
	}
}