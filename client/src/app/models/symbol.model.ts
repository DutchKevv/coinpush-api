import { BaseModel } from "./base.model";
import { Observable, BehaviorSubject } from "rxjs";

export class SymbolModel {

	public price$: BehaviorSubject<any> = new BehaviorSubject(0);

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

		this.price$.next(this.options.bid);
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