import {BaseModel} from './base.model';

export class CommentModel extends BaseModel {
	public static readonly DEFAULTS: any = {
		_id: null,
		user_id: null,
		channel_id: null,
		content: '',
		children: [],
		iLike: false,
		likeCount: 0
	}

}