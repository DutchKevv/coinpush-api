import { BaseModel } from './base.model';
// import * as TimeAgo from 'javascript-time-ago';
// import * as en from 'javascript-time-ago/locale/en'

import * as TimeAgo2 from 'time-ago';

export interface IComment {
	_id?: string;
	createUser?: any;
	createdAt?: string;
	content: string;
	children?: Array<CommentModel>;
	iLike?: boolean;
	likeCount?: 0;
	isNew?: boolean;
	isNews?: boolean;
	fromNow?: string;
	imgs?: Array<string>;
	data?: any;
	type?: string;
}

export class CommentModel extends BaseModel {

	private _fromNowInterval: any;
	private _fromNowIntervalDelay: number = 5000;

	public static readonly DEFAULTS: IComment = {
		_id: null,
		createUser: null,
		createdAt: null,
		content: '',
		children: [],
		iLike: false,
		likeCount: 0,
		isNew: false,
		fromNow: '',
		imgs: []
	}

	constructor(options: IComment) {
		super(options);

		this.options.fromNow = TimeAgo2.ago(this.options.createdAt);
	}

	public onDestroy() {
		this._stopFromNowInterval();
	}

	private _startFromNowInterval() {
		this._fromNowInterval = setInterval(() => {
			this.options.fromNow = TimeAgo2.ago(this.options.createdAt);
		}, this._fromNowIntervalDelay);
	}

	private _stopFromNowInterval() {
		clearInterval(this._fromNowIntervalDelay);
	}
}