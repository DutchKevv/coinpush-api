import {Base} from '../../../shared/classes/Base';

export class UserModel extends Base {
	public static readonly DEFAULTS: any = {
		id: 0,
		username: '',
		following: false,
		followers: 0,
		balance: 0,
		iFollow: false,
		iCopy: false,
		transactions: 0,
		profileImg: ''
	}

}