import {Base} from '../../../shared/classes/Base';

export class ChannelModel extends Base {
	public static readonly DEFAULTS: any = {
		id: 0,
		user_id: null,
		followers: 0,
		iFollow: false,
		public: true,
		trades: 0,
		startDate: null,
		liveTime: 0
	}

}