import { Injectable } from '@angular/core';
import { Response, Http } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import { CommentModel } from '../models/comment.model';
import { AlertService } from './alert.service';
import { UserService } from "./user.service";

@Injectable()
export class CommentService {

	constructor(private _http: Http, private _alertService: AlertService, private _userService: UserService) {

	}

	async create(toUserId = null, parentId: string = null, content: string): Promise<CommentModel> {
		const comment = await this._http.post('/comment', { toUserId, parentId, content })
			.map(res => res.json())
			.toPromise();

		if (!comment)
			return;

		const model = new CommentModel({
			...comment,
			content,
			isNew: true,
			created: new Date(),
			toUser: toUserId,
			parentId,
			createUser: {
				_id: this._userService.model.get('_id'),
				name: this._userService.model.get('name'),
				img: this._userService.model.get('img'),
			}
		});

		return model;
	}

	async findById(id: string): Promise<Array<CommentModel>> {
		const result = await this._http.get('/comment/' + id)
			.map(res => [res.json()].map(r => {
				const model = new CommentModel(r);
				model.options.children = model.options.children.map(c => new CommentModel(c));
				return model;
			}))
			.toPromise();

		return result;
	}

	async findByUserId(toUserId: string, offset: number = 0, limit: number = 5): Promise<Array<CommentModel>> {
		const result = await this._http.get('/comment', { params: { toUserId, offset, limit } })
			.map(res => res.json().map(r => {
				const model = new CommentModel(r);
				model.options.children = model.options.children.map(c => new CommentModel(c));
				return model;
			}))
			.toPromise();

		return result;
	}

	async findChildren(parentId: string, offset: number = 0, limit: number = 5) {
		const result = await this._http.get('/comment/' + parentId, { params: { childrenOnly: true, offset, limit } })
			.map(res => res.json().map(r => new CommentModel(r)))
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
		model.set({ iLike: !!result.state, likeCount: newCount });
	}
}