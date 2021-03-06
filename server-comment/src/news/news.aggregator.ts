import { commentController } from "../controllers/comment.controller";
import { User } from "../schemas/user.schema";
import { Comment } from "../schemas/comment.schema";
import { CCNScraper } from "./scrapers/ccn.scraper";
import { CoinDeskScraper } from "./scrapers/coindesk.scraper";
import { IGScraper } from "./scrapers/ig.scraper";

const MAX_CONTENT_LENGTH = 700;

export interface IArticle {
    createdAt: string;
    createUser?: string;
    url: string;
    title: string;
    imgs: Array<string>;
    content: string;
}

export class NewsAggregator {

    private _apis: Array<any> = [];
    private _loopInterval: any = null;
    private _loopIntervalDelay: number = 1000 * 60 * 5 // 5 minutes
    private _lastCheck = null;

    public init(): Promise<void> {
        return this._installApis();
    }

    public start() {
        this._loopApis();
        this._loopInterval = setInterval(() => this._loopApis(), this._loopIntervalDelay);
    }

    public stop() {
        clearInterval(this._loopInterval);
    }

    private _loopApis() {
        // foreach api
        this._apis.forEach(async api => {

            try {
                if (!api.ID) 
                    return console.error('App class does not have ID field');

                const companyUser = await User.findOne({companyId: api.ID}, {_id: 1}).lean();
                if (!companyUser)
                    return console.error('(news)companyUser not found: ' + api.ID);

                const lastArticle = await Comment.findOne({createUser: companyUser._id}).sort({ createdAt: -1 }).lean();
                const lastDate = lastArticle ? lastArticle.createdAt : undefined;
                
                // load new articles
                const articles = await api.scrape(lastDate);
                if (!articles || !articles.length)
                    return;

                // foreach article create news post
                articles.forEach(article => {
                    article.createUser = companyUser._id;
                    article.content = this._prettySubstring(article.content);
                    commentController.createNewsArticle(article).catch(console.error);
                });
            } catch (error) {
                console.error(error);
            }
        });
    }

    private _prettySubstring(text: string): string {
        const lines = text.split('.'); 
        let length = 0;


        for (let i = 0, len = lines.length; i < len; i++) {
            length += lines[i].length;
            if (length > MAX_CONTENT_LENGTH) {
                return lines.splice(-(lines.length - i)).join('.')
            }
        }

        return text;
    }

    private async _installApis(): Promise<void> {
        this._apis.push(new CCNScraper());
        this._apis.push(new CoinDeskScraper());
        this._apis.push(new IGScraper());

        await Promise.all(this._apis.map(api => {
            
        }));
    }
}