import { json, urlencoded } from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import { client } from './modules/redis';
import { eventController } from './controllers/event.controller';

// error catching
process.on('unhandledRejection', (reason, p) => {
    console.log('Catched *global* Unhandled Rejection at: Promise ', p, ' reason: ', reason);
    throw reason;
});

// configuration
const config = require('../../tradejs.config');

export const app = {

    api: null,

    _eventCheckTimeout: null,
    _eventCheckTimeoutTime: 2000,

    async init(): Promise<void> {
        this._setRedisListener();
        this._toggleEventCheckTimeout();
        this._setupApi();
    },

    _setRedisListener() {
        // client.subscribe("symbols");

        client.on("message", (channel, message) => {
            let data;
            
            try {
                data = JSON.parse(message);
            } catch (error) {
                return console.error(error);
            }

            switch (channel) {
                case 'symbols':
                    console.log(data);
                case 'ticks':
                   
                    break;
                case 'bar':
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
        this.api.use(urlencoded({ extended: false }));

        this.api.use('/event', require('./api/event.api'));
    },

    _toggleEventCheckTimeout() {

        const timeoutFunc = async function () {
			try {

				eventController.checkEvents();
			} catch (error) {
				console.error(error);
			} finally {
				this._eventCheckTimeout = setTimeout(timeoutFunc, this._eventCheckTimeoutTime);
			}
		}.bind(this);

		this._eventCheckTimeout = setTimeout(() => timeoutFunc(), this._eventCheckTimeoutTime);
    }
};


