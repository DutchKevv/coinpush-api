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

		this.price$.next(true);
	}
}