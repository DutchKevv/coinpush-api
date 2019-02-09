import { json, urlencoded } from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import * as mongoose from 'mongoose';
import { pubClient, subClient } from 'coinpush/src/redis';
import { log } from 'coinpush/src/util/util.log';
import { eventController } from './controllers/event.controller';
import { config } from 'coinpush/src/util/util-config';

// error catching
process.on('unhandledRejection', (reason, p) => {
    console.log('Catched *global* Unhandled Rejection at: Promise ', p, ' reason: ', reason);
    throw reason;
});

export class App {

    api: any;
    db: mongoose.Connection;

    _eventCheckTimeout: any;
    _eventCheckTimeoutTime: number = 2000;

    async init(): Promise<void> {
        await this._connectMongo();
        
        this._setRedisListener();
        this._toggleEventCheckTimeout();
        this._setupApi();
    }

    _setRedisListener() {
        subClient.subscribe("ticks");

        subClient.on("message", (channel, message) => {
            let data;
            
            try {
                data = JSON.parse(message);
            } catch (error) {
                return console.error(error);
            }

            switch (channel) {
                case 'ticks':
                    // eventController.checkEvents();
                    break;
                case 'bar':
                    break;
            }
        });
    }

    _setupApi(): void {
        this.api = express();
        const server = this.api.listen(config.server.event.port, '0.0.0.0', () => log.info('App', `Service started on      : 0.0.0.0:${config.server.event.port}`));

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
    }

    _connectMongo() {
		return new Promise((resolve, reject) => {
            // mongoose.set('debug', process.env.NODE_ENV === 'development');
            (<any>mongoose).Promise = global.Promise; // Typescript quirk
            
            this.db = mongoose.connection;
			this.db.on('error', error => {
				console.error('connection error:', error);
				reject();
			});
			this.db.once('open', () => {
				console.log('Event DB connected');
				resolve();
			});

			mongoose.connect(config.server.event.connectionString);
		});
	}

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


