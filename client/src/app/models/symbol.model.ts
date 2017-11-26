import {BaseModel} from "./base.model";
import {Subject} from "rxjs/Subject";

export class SymbolModel extends BaseModel {
	public price$: Subject<any> = new Subject();

	public tick(ticks) {

		ticks.forEach(tick => {
			this.set({
				direction: this.options.bid > tick[1] ? 'down' : 'up',
				bidDirection: this.options.bid > tick[1] ? 'down' : 'up',
				bid: tick[1],
				askDirection: this.options.ask > tick[2] ? 'down' : 'up',
				ask: tick[2]
			}, false, true);
		});

		this._updateChangedAmount();

		this.price$.next(true);
	}

	private _updateChangedAmount() {
		const startPrice = this.options.marks.D.price;
		const nowPrice = this.options.bid;

		const perc = Number(((nowPrice - startPrice) / startPrice * 100).toFixed(2));
		
		// Only update if changed
		if (this.options.changedAmount !== perc)
			this.set({changedAmount: perc});
	}

	/**
	 * TEMP!! to fix AOT
	 */ 
	setZoom(step: Number) {

	}
}