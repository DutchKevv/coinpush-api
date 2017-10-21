import {BaseModel} from './base.model';
import {LEVERAGE_TYPE_1} from '../../../../shared/constants/constants';

export class UserModel extends BaseModel {
	public static readonly DEFAULTS: any = {
		username: '',
		following: false,
		followers: 0,
		balance: 0,
		favorites: [],
		leverage: LEVERAGE_TYPE_1,
		iFollow: false,
		iCopy: false,
		transactions: 0,
		profileImg: ''
	}

}