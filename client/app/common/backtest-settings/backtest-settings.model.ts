import {BaseModel} from '../../models/base.model';
import * as moment from 'moment';

export class BacktestSettingsModel extends BaseModel {

	public data = {
		ea: 'example',
		instruments: [],
		timeFrame: 'M15',
		from: BacktestSettingsModel.parseDate(new Date(Date.now() - 1000000000)),
		until: BacktestSettingsModel.parseDate(new Date()),
		equality: 10000,
		currency: 'euro',
		leverage: '1:10',
		pips: 10
	};


	constructor(data) {
		super();

		if (data)
			this.set(data, false);
	}

	static parseDate(date: String | Date): String {
		return moment(date).format('YYYY-MM-DD');
	}
}