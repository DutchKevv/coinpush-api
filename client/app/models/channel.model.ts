import {Base} from '../../../shared/classes/Base';
import {CHANNEL_TYPE_CUSTOM} from '../../../shared/constants/constants';

export class ChannelModel extends Base {
	public static readonly DEFAULTS: any = {
		_id: null,
		user_id: null,
		name: '',
		description: '',
		followers: 0,
		following: false,
		public: true,
		transactions: 0,
		type: CHANNEL_TYPE_CUSTOM
	}

}