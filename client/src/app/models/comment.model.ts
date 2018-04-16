import {BaseModel} from './base.model';
import * as moment from 'moment';

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

		this.options.fromNow = moment(this.options.created).fromNow()
	}
}