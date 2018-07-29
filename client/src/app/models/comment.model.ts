import {BaseModel} from './base.model';
// import * as TimeAgo from 'javascript-time-ago';
// import * as en from 'javascript-time-ago/locale/en'

import * as TimeAgo2 from 'time-ago';

export class CommentModel extends BaseModel {
	public static readonly DEFAULTS: any = {
		_id: null,
		createUserId: null,
		created: null,
		content: '',
		children: [],
		iLike: false,
		likeCount: 0,
		isNew: false,
		fromNow: ''
	}

	constructor(options: any) {
		super(options);

		this.options.fromNow = TimeAgo2.ago(new Date(this.options.createdAt));
	}
}