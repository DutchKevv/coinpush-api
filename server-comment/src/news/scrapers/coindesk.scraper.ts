import * as cheerio from 'cheerio';
import * as rr from 'requestretry';
import { IArticle } from '../news.aggregator';

const URL = 'https://www.coindesk.com';

export class CoinDeskScraper {

    public readonly ID: string = 'coindesk';

    async scrape(fromDate: string | number | Date): Promise<Array<IArticle>> {
        if (fromDate && !(fromDate instanceof Date))
            fromDate = new Date(fromDate);

        const result = await rr(URL);
        const $ = cheerio.load(result.body);

        // get articles
        const articles = [];
        $('#content .article').each((index, el) => {
            const $el = $(el);
            const createdAt = $el.find('.timeauthor time').attr('datetime');
           
            if (createdAt && (!fromDate || new Date(createdAt) > fromDate)) {
                const url = $el.find('.picture a').attr('href');

                if (url)
                    articles.push({url, createdAt});
                else
                    console.log('could not find article url in: ' + URL);             
            }
        });

        // loop over each article
        const asyncList = articles.map(async article => {
            const result = await rr(article.url);
            const $ = cheerio.load(result.body);

            // TODO: multiple
            let imgUrl = $('.article-top-image-section').css('background-image');
            imgUrl = imgUrl.substring(5, imgUrl.length).substring(0, imgUrl.length - 7);

            return {
                url: article.url,
                title: $('.article-top-title').text(),
                imgs: imgUrl ? [imgUrl]: undefined,
                content: $('.article-content-container').text(),
                createdAt: article.createdAt
            }
        });

        return Promise.all(asyncList);
    }
}