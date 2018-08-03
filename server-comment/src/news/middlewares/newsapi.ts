import * as request from 'requestretry';
import { config } from '../../../../shared/modules/coinpush/src/util/util-config';

export class NewsApi {

    constructor() {}

    public async get(fromDate?: string | number | Date) {

        const messages = await request({
            uri: 'https://newsapi.org/v2/top-headlines?sources=crypto-coins-news&apiKey=' + config.news.newsApi.key,
            json: true
        });

        return messages.body.articles.map(message => this._normalizeMessage(message));
    }

    private _normalizeMessage(message): any {
        return {
            title: message.title,
            content: message.description,
            imgs: message.urlToImage ? [message.urlToImage]: undefined,
            url: message.url,
            source: message.source,
            publishedAt: message.publishedAt
        };
    }
}