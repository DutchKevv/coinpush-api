import { NewsApi } from "./middlewares/newsapi";
import { commentController } from "../controllers/comment.controller";

export class NewsAggregator {

    private _apis: Array<any> = [];
    private _loopInterval: any = null;
    private _loopIntervalDelay: number = 1000 * 60 * 5 // 5 minutes
    private _lastCheck = null;

    constructor() {
        this._installApis();
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

            const companyLatest = await 

            // load new articles
            api.get().then(articles => {

                if (!articles || !articles.length)
                    return;

                try {
                    
                    
                    // foreach article
                    articles.forEach((article, index) => {
                        // console.log(article);
                        // if (index > 0)
                        //     return;
                        // create news post
                        article.isNews = true;
                        article.createCompany = article.source;
                        commentController.createNewsArticle(article).catch(console.error);
                    });
                } catch (error) {
                    console.error(error);
                }
            }).catch(console.error);
        });
    }

    private _installApis() {
        this._apis.push(new NewsApi());
    }
}