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
        $('.article-set .stream-article').each((index, el) => {
            const $el = $(el);
            const createdAt = $el.find('time').attr('datetime');
  
            if (createdAt && (!fromDate || new Date(createdAt) > fromDate)) {
                const url = $el.attr('href');

                if (url)
                    articles.push({url, createdAt});
                else
                    console.log('could not find article url in: ' + URL);             
            } else {
                console.log('??')
            }
        });

        // loop over each article
        const asyncList = articles.map(async article => {
            const result = await rr(article.url);
            const $ = cheerio.load(result.body);

            // TODO: multiple
            let imgUrl = $('.coindesk-article-header-image picture img').attr('src');
            // console.log(imgUrl);
            // imgUrl = imgUrl.substring(0, imgUrl.length);
            // imgUrl = imgUrl.substring(5, imgUrl.length).substring(0, imgUrl.length - 5);

            return {
                url: article.url,
                title: $('.coindesk-article-header-image .meta').text(),
                imgs: imgUrl ? [imgUrl]: undefined,
                content: $('.article-content').text(),
                createdAt: article.createdAt
            }
        });

        return Promise.all(asyncList);
    }
}