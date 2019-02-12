import * as express from 'express';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import * as mongoose from 'mongoose';
import { json, urlencoded } from 'body-parser';
import { notifyController } from './controllers/notify.controller';
import { subClient } from 'coinpush/src/redis';
import { config } from 'coinpush/src/util/util-config';
import { G_ERROR_DUPLICATE_FIELD, MONGO_ERROR_VALIDATION } from 'coinpush/src/constant';
import { log } from 'coinpush/src/util/util.log';

export class App {
	
	public readonly api: express.Application = express();
	public readonly db: mongoose.Connection = mongoose.connection;
	public readonly isProd: boolean = (process.env.NODE_ENV || '').startsWith('prod');

	public async init(): Promise<void> {
		await this._initDb();
		this._initRedis();
		this._initApi();
	}

	private _initApi(): void {
		this.api.use(morgan('dev'));
		this.api.use(helmet());
		this.api.use(json());
		this.api.use(urlencoded({ extended: false }));
		this.api.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
			res.header('Access-Control-Allow-Origin', '*');
			next();
		});
		
		/**
		 * Add 'user' variable to request, holding userID
		 */
		this.api.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
			req['user'] = { id: req.headers['_id'] };
			next();
		});
		
		this.api.use('/notify', require('./api/notify.api'));
		this.api.use('/mail', require('./api/email.api'));
		this.api.use('/user', require('./api/user.api'));
		this.api.use('/device', require('./api/device.api'));
		
		this.api.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {	
			if (res.headersSent) {
				log.error('API', error);
				return next(error);
			}
				
			// pre-handled error
			if (error.statusCode)
				return res.status(error.statusCode).send(error);
		
			// to-handle error
			if (error.name === MONGO_ERROR_VALIDATION)
				return res.status(409).send({ code: G_ERROR_DUPLICATE_FIELD, field: Object.keys(error.errors)[0] });
		
			// system error
			log.error('API', error);
			res.status(500).send(error || 'Unknown error');
		});

		this.api.listen(config.server.notify.port, '0.0.0.0', () => console.log(`\n Notify service started on      : 0.0.0.0:${config.server.notify.port}`));
	}

	private _initDb(): Promise<void> {
		return new Promise((resolve, reject) => {
			mongoose.connect(config.server.notify.connectionString, { useNewUrlParser: true }, (error: mongoose.Error) => {
				if (error) return reject(error);
				
				resolve();
			});
		});	
	}

	private _initRedis(): void {
		subClient.subscribe("notify");
		subClient.on("message", (channel: string, message: any) => {
		
			switch (channel) {
				case 'notify':
					notifyController.parse(JSON.parse(message)).catch(console.error);
					break;
			}
		});
	}
}