import {Injectable} from '@angular/core';
import {Response, Http} from '@angular/http';

import {Observable} from 'rxjs/Observable';
import {CommentModel} from '../models/comment.model';
import {AlertService} from './alert.service';
import {UserService} from "./user.service";

@Injectable()
export class CommentService {

	constructor(private _http: Http, private _alertService: AlertService, private _userService: UserService) {

	}

	async create(channelId: string = null, parentId: string = null, content: string): Promise<CommentModel> {
		const comment = await this._http.post('/comment', {channelId, parentId, content})
			.map(res => res.json())
			.toPromise();

		if (!comment)
			return;

		const model = new CommentModel({
			...comment,
			content,
			created: new Date(),
			parentId: parentId,
			username: this._userService.model.get('name'),
			profileImg: this._userService.model.get('profileImg'),
		});

		return model;
	}

	async findByChannelId(channelId: string): Promise<Array<CommentModel>> {
		const result = await this._http.get('/comment', {params: {channel: channelId}})
			.map(res => res.json().map(r => {
				const model = new CommentModel(r);
				model.options.children = model.options.children.map(c => new CommentModel(c));
				return model;
			}))
			.toPromise();

		return result;
	}

	update(model: CommentModel, options): Observable<Response> {
		return this._http.put('/comment/' + model.get('_id'), options);
	}

	delete(model: CommentModel): Observable<Response> {
		return this._http.delete('/comment/' + model.get('_id'));
	}

	async toggleLike(model: CommentModel) {
		const result = await this._http.post('/comment/like/' + model.get('_id'), {})
			.map(r => r.json())
			.toPromise();

		const newCount = model.get('likeCount') + (result.state ? 1 : -1);
		model.set({iLike: !!result.state, likeCount: newCount});
	}
}