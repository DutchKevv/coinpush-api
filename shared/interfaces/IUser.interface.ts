export interface IUser {
	_id?: string;
	name?: string;
	email?: string;
	balance?: number;
	password?: string;
	gender?: number;
	country?: string;
	language?: string;
	img?: string;
	description?: string;
	favorites?: Array<string>
}