import { BaseModel } from "./base.model";
import { Observable, BehaviorSubject } from "rxjs";

export class SymbolModel {

	public price$: BehaviorSubject<any> = new BehaviorSubject(0);

	constructor(public options) {
		this.options.highD = this.priceToFixed(this.options.highD);
		this.options.lowD = this.priceToFixed(this.options.lowD);
	}

	/**
	 * ensure number is x digits long
	 * @param number 
	 */
	public priceToFixed(number: number): string | number {
		if (typeof number === 'string')
			number = parseFloat(number);

		if (this.options.precision === 0 || this.options.precision < 0) {
			return number;
		}
		else if (!this.options.precision) {
			return number.toPrecision(5);
		} 
		else {
			return number.toFixed(this.options.precision);
		}
	}

	/**
	 * 
	 * @param ticks 
	 */
	public tick(ticks: Array<Array<number>>): void {

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

	private _updateChangedAmount(): void {
		if (!this.options.marks.H)
			return;
			// return console.warn('Symbol ' + this.options.name + ' is incomplete');

		this.options.marks.H.price = this.priceToFixed(this.options.marks.H.price);
		this.options.marks.D.price = this.priceToFixed(this.options.marks.D.price);

		this.options.changedHAmount = Number(((this.options.bid - this.options.marks.H.price) / this.options.marks.H.price * 100).toFixed(2));
		this.options.changedDAmount = Number(((this.options.bid - this.options.marks.D.price) / this.options.marks.D.price * 100).toFixed(2));
	}
	
}