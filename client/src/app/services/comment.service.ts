import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { CommentModel } from '../models/comment.model';
import { AlertService } from './alert.service';
import { UserService } from "./user.service";
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable()
export class CommentService {

	constructor(private _http: HttpClient, private _alertService: AlertService, private _userService: UserService) {

	}

	async create(toUserId = null, parentId: string = null, content: string): Promise<CommentModel> {
		const comment = <any>await this._http.post('/comment', { toUserId, parentId, content }).toPromise();

		if (!comment || !comment.body)
			return;

		const model = new CommentModel({
			...comment.body,
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
		const result = <any>await this._http.get('/comment/' + id)
			.map(r => {
				const model = new CommentModel(r);
				model.options.children = model.options.children.map(c => new CommentModel(c));
				return model;
			})
			.toPromise();

		return result;
	}

	async findByUserId(toUserId: string, offset: number = 0, limit: number = 5): Promise<Array<CommentModel>> {
		const params = new HttpParams({
			fromObject: {
				toUserId: toUserId.toString(),
				offset: offset.toString(),
				limit: limit.toString()
			}
		});

		const result = await this._http.get('/comment', { params })
			.map((r: any) => {
				return r.body.map(comment => {
					const model = new CommentModel(comment);
					model.options.children = model.options.children.map(c => new CommentModel(c));
					return model;
				});
			})
			.toPromise();
		return result;
	}

	async findChildren(parentId: string, offset: number = 0, limit: number = 5) {
		const params = new HttpParams({
			fromObject: {
				childrenOnly: 'true',
				offset: offset.toString(),
				limit: limit.toString()
			}
		});

		const result = await this._http.get('/comment/' + parentId, { params })
			.map(r => new CommentModel(r))
			.toPromise();

		return result;
	}

	update(model: CommentModel, options): Observable<Response> {
		return <any>this._http.put('/comment/' + model.get('_id'), options);
	}

	delete(model: CommentModel): Observable<any> {
		return <any>this._http.delete('/comment/' + model.get('_id'));
	}

	async toggleLike(model: CommentModel) {
		const result = <any>await this._http.post('/comment/like/' + model.get('_id'), {})
			.toPromise();

		const newCount = model.get('likeCount') + (result.state ? 1 : -1);
		model.set({ iLike: !!result.state, likeCount: newCount });
	}
}