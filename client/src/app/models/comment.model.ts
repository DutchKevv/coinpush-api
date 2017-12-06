import {BaseModel} from './base.model';

export class CommentModel extends BaseModel {
	public static readonly DEFAULTS: any = {
		_id: null,
		createUserId: null,
		content: '',
		children: [],
		iLike: false,
		likeCount: 0,
		isNew: false
	}

}