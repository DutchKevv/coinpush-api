import {CHANNEL_TYPE_CUSTOM} from '../../../../shared/constants/constants';
import {BaseModel} from './base.model';

export class ChannelModel extends BaseModel {
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