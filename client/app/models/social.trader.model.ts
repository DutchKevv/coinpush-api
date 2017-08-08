import {Base} from '../../../shared/classes/Base';

export class TradingChannelModel extends Base {
	public static readonly DEFAULTS: any = {
		id: -1,
		username: '',
		environment: 'practice',
		following: false,
		followers: 0,
		followersEquality: 0,
		transactions: 0,
		runTime: 0,
		pips: 0,
		profit: 0,
		profileImg: ''
	}

}