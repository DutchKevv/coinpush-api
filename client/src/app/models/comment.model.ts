import {BaseModel} from './base.model';
// import TimeAgo from 'javascript-time-ago';

// const timeAgo = new TimeAgo('en-US');

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

		// this.options.fromNow = timeAgo.format(this.options.created);
	}
}