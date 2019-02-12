import * as path from 'path';
import * as cheerio from 'cheerio';
import * as rr from 'requestretry';
import { IArticle } from '../news.aggregator';

const URL = 'https://www.ccn.com';

export class CCNScraper {

    public readonly ID: string = 'crypto-coins-news';

    public userData =  {
        "name": "Crypto Coins News",
        "id": "crypto-coins-news",
        "email": "ccn-company@coinpush.app",
        "password": "test",
        "img": path.join(__dirname, '../iamges/ccn.jpg'),
    };

    async scrape(fromDate: string | number | Date): Promise<Array<IArticle>> {
        if (fromDate && !(fromDate instanceof Date))
            fromDate = new Date(fromDate);

        const result = await rr(URL);
        const $ = cheerio.load(result.body);

        // get articleLink
        
        const articles = [];
        $('.category-news header').each((index, el) => {
            const $el = $(el);
            const createdAt = $el.find('time').attr('datetime');

            if (createdAt && (!fromDate || new Date(createdAt) > fromDate)) {
                const url = $el.find('h4 a').attr('href');

                if (url)
                    articles.push({ url, createdAt });
                else
                    console.log('could not find article url in: ' + URL);
            }
        });

        // loop over each article
        const asyncList = articles.map(async article => {
            const result = await rr(article.url);
            const $ = cheerio.load(result.body);

            // TODO: multiple
            const img = $('.attachment-large-thumb').attr('data-cfsrc');

            return <IArticle>{
                url: article.url,
                title: $('article .entry-title').text(),
                imgs: img ? [img] : undefined,
                content: $('.entry-content > p').text(),
                createdAt: article.createdAt
            }
        });

        return Promise.all(asyncList);
    }
}