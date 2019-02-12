import { BaseModel } from './base.model';
import { LEVERAGE_TYPE_1 } from 'coinpush/src/constant';

export class UserModel extends BaseModel {
	public static readonly DEFAULTS: any = {
		name: '',
		gender: 0,
		country: 'US',
		balance: 0,
		favorites: [],
		followers: [],
		followersCount: 0,
		leverage: LEVERAGE_TYPE_1,
		iFollow: false,
		transactions: 0,
		profileImg: '',
		token: ''
	}

}