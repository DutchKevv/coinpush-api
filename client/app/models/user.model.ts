import {Base} from '../../../shared/classes/Base';

export class UserModel extends Base {
	public static readonly DEFAULTS: any = {
		id: 0,
		username: '',
		following: false,
		followers: 0,
		follow: false,
		transactions: 0,
		profileImg: ''
	}

}