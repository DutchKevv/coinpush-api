import { Injectable, Output } from '@angular/core';
import { UserModel } from '../models/user.model';
import { USER_FETCH_TYPE_SLIM } from 'coinpush/src/constant';

const API_KEY = '4c6cf9f4344d4475949be83f9432db78';

@Injectable({
	providedIn: 'root',
})
export class NewsService {

	constructor() {

	}

	async find(): Promise<any> {
		const results = await Promise.all(
			[
				// $.get(`https://newsapi.org/v2/top-headlines?sources=bloomberg&apiKey=${API_KEY}`),
				// $.get(`https://newsapi.org/v2/everything?q=bitcoin&sortBy=publishedAt&apiKey=${API_KEY}`)
			]
		);

		return {
			top: results[0].articles,
			crypto: results[1].articles
		}
	}
}