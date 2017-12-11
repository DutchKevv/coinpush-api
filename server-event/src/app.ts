import { json, urlencoded } from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import * as redis from './modules/redis';

// error catching
process.on('unhandledRejection', (reason, p) => {
    console.log('Catched *global* Unhandled Rejection at: Promise ', p, ' reason: ', reason);
    throw reason;
});

// configuration
const config = require('../../tradejs.config');

export const app = {

    api: null,

    async init(): Promise<void> {
        this._setupApi();
    },

    setRedisListener() {
        redis.client.on("message", function (channel, message) {
            let data;

            try {
                data = JSON.parse(message);
            } catch (error) {
                return console.error(error);
            }

            switch (channel) {
                case 'price-change-perc':

                    break;
            }
        });
    },

    _setupApi(): void {
        this.api = express();
        const server = this.api.listen(config.server.event.port, () => console.log(`\n Event service started on      : 127.0.0.1:${config.server.event.port}`));

        this.api.use(morgan('dev'));
        this.api.use(helmet());

        this.api.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', '_id, Authorization, Origin, X-Requested-With, Content-Type, Accept');
            next();
        });

        this.api.use((req: any, res, next) => {
            req.user = { id: req.headers['_id'] };
            next();
        });

        this.api.use(json());
        this.api.use(urlencoded({extended: false}));
        
        this.api.use('/event', require('./api/event.api'));
    },
};


