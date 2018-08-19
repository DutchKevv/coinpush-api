import * as cheerio from 'cheerio';
import * as rr from 'requestretry';
import { IArticle } from '../news.aggregator';

const URL = 'https://www.ig.com/au/forex-news';

export class IGScraper {

    public readonly ID: string = 'ig';

    async scrape(fromDate: string | number | Date): Promise<Array<IArticle>> {
        if (fromDate && !(fromDate instanceof Date))
            fromDate = new Date(fromDate);

        const result = await rr(URL);
        const main$ = cheerio.load(result.body);

        // get articleLink
        const articles = [];
        main$('.article-category-section-item').each((index, el) => {
            const $el = main$(el);
            const createdAt = $el.find('.article-category-section-date.time').attr('data-datetime');

            if (createdAt && (!fromDate || new Date(createdAt) > fromDate)) {
                let url = $el.find('a.primary').attr('href');
                let img;

                if (url) {
                    url = 'https://www.ig.com' + url;
                    img = 'https://' + $el.find('.article-category-section-img').attr('src');
                    articles.push({ url: url, createdAt, imgs: [img] });
                }
                    
                else
                    console.log('could not find article url in: ' + URL);
            }
        });

        // loop over each article
        const asyncList = articles.map(async (article, index) => {
           
            const result = await rr(article.url);
            const child$ = cheerio.load(result.body);
            
            const articleObj = <IArticle>{
                url: article.url,
                title: child$('.news_content .marketNameWrapper').text(),
                imgs: article.imgs,
                content: child$('.text').text(),
                createdAt: article.createdAt
            };

            return articleObj;
        });

        return Promise.all(asyncList);
        // return Promise.all([]);
    }
}