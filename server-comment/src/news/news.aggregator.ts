import { commentController } from "../controllers/comment.controller";
import { User } from "../schemas/user.schema";
import { Comment } from "../schemas/comment.schema";
import { CCNScraper } from "./scrapers/ccn.scraper";
import { CoinDeskScraper } from "./scrapers/coindesk.scraper";
import { Types } from "mongoose";


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

    constructor() {
        this._installApis();
    }

    public async init() {

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
                articles.forEach((article, index) => {
                    // console.log(article);
                    article.createUser = companyUser._id;
                    commentController.createNewsArticle(article).catch(console.error);
                });
            } catch (error) {
                console.error(error);
            }
        });
    }

    private _installApis() {
        this._apis.push(new CCNScraper());
        this._apis.push(new CoinDeskScraper());
    }
}