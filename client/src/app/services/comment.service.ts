import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommentModel } from '../models/comment.model';
import { UserService } from "./user.service";
import { HttpClient, HttpParams } from '@angular/common/http';

import { map } from 'rxjs/operators';
import { DateService } from './date.service';
import { AccountService } from './account/account.service';

@Injectable({
	providedIn: 'root',
})
export class CommentService {

	constructor(
		private _http: HttpClient,
		private _accountService: AccountService) {

	}

	async create(toUserId = null, parentId: string = null, content: string, images: string[]): Promise<CommentModel> {
		const comment = <any>await this._http.post('/comment', { toUserId, parentId, content, images }).toPromise();
		const account = this._accountService.account$.getValue();

		if (!comment)
			return;

		const model = new CommentModel({
			...comment,
			content,
			isNew: true,
			imgs: images,
			createdAt: new Date(),
			toUser: toUserId,
			parentId,
			createUser: {
				_id: account._id,
				name: account.name,
				img: account.img,
			}
		});

		return model;
	}

	public async findTimeline(options: {offset?: number, limit?: number, sources?: Array<any>} = {}): Promise<Array<CommentModel>> {

		const params = new HttpParams({
			fromObject: {
				offset: (options.offset || 0).toString(),
				limit: (options.limit || 10).toString(),
				sources: JSON.stringify(options.sources || undefined)
			}
		});

		const result = <any>await this._http.get('/timeline', { params }).pipe(map((res: any) => {
			return res.map((object => {
				const model = new CommentModel(object);
				model.options.children = model.options.children.map(c => new CommentModel(c));
				return model;
			}))
		})).toPromise();

		return result
	}

	public findById(id: string): Promise<CommentModel> {
		return this._http.get('/comment/' + id)
			.pipe(map((res: any) => {
				const model = new CommentModel(res.body);
				model.options.children = model.options.children.map(c => new CommentModel(c));
				return model;
			}))
			.toPromise();
	}

	async findByUserId(toUserId: string, offset: number = 0, limit: number = 5) {
		const params = new HttpParams({
			fromObject: {
				toUserId: toUserId.toString(),
				offset: offset.toString(),
				limit: limit.toString()
			}
		});

		return this._http.get('/comment', { params })
			.pipe(map((r: any) => {
				return r.body.map(comment => {
					const model = new CommentModel(comment);
					model.options.children = model.options.children.map(c => new CommentModel(c));
					return model;
				});
			})).toPromise();
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
			.pipe(map((res: any) => res.body.map(c => new CommentModel(c))))
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
		console.log(model, result);
		const newCount = model.get('likeCount') + (result.body.state ? 1 : -1);
		model.set({ iLike: !!result.body.state, likeCount: newCount });
	}
}