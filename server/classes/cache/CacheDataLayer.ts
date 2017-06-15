import * as fs          from 'fs';
import * as winston     from 'winston-color';
import * as moment 		from '../../../shared/node_modules/moment';
import {timeFrameSteps} from '../../util/date';

const sqLite = require('sqlite3');

export default class CacheDataLayer {

	private _db: any;
	private _tableList = [];

	get tableList() {
		return this._tableList;
	}

	constructor(protected options) {
	}

	public async init() {
		await this._openDb();
		return this._setTableList();
	}

	public read(symbol: string, timeFrame: string, from: number, until: number, count: number, bufferOnly = true): Promise<Float64Array> {

		return new Promise((resolve, reject) => {

			let tableName = this._getTableName(symbol, timeFrame),
				fromPretty = from ? moment(from).format('MMM Do YYYY hh:mm:ss') : 'unknown',
				untilPretty = until ? moment(until).format('MMM Do YYYY hh:mm:ss') : 'unknown',
				queryString;

			winston.info(`DataLayer: Read ${tableName} from ${fromPretty} until ${untilPretty} count ${count}`);

			queryString = `SELECT data FROM ${tableName} `;

			if (count) {
				if (until) {
					queryString += `WHERE time < ${until} ORDER BY time LIMIT ${count} `;
				} else {
					queryString += `WHERE time > ${from} ORDER BY time LIMIT ${count} `;
				}
			} else {
				count = 500;

				if (from && until) {
					queryString += `WHERE time >= ${from} AND time <= ${until} ORDER BY time DESC LIMIT ${count}`;
				}
				else if (from) {
					queryString += `WHERE time >= ${from} ORDER BY time DESC LIMIT ${count}`;
				}
				else {

				}
			}

			this._db.all(queryString, (err, rows) => {

				if (err)
					return reject(err);

				let mergedBuffer = Buffer.concat(rows.map(row => row.data), rows.length * (10 * Float64Array.BYTES_PER_ELEMENT));

				if (bufferOnly) {
					return resolve(mergedBuffer);
				} else {
					resolve(new Float64Array(mergedBuffer.buffer));
				}
			});
		});
	}

	public async write(symbol, timeFrame, buffer: NodeBuffer) {

		return new Promise((resolve, reject) => {
			if (!buffer.length)
				return resolve();

			if (buffer.length % Float64Array.BYTES_PER_ELEMENT !== 0)
				return reject(`DataLayer: Illegal buffer length, should be multiple of 8 (is ${buffer.length})`);

			let tableName = this._getTableName(symbol, timeFrame),
				rowLength = 10 * Float64Array.BYTES_PER_ELEMENT;

			this._db.serialize(() => {
				let now;

				this._db.run('BEGIN TRANSACTION', () => {
					now = Date.now();
				});

				let stmt = this._db.prepare(`INSERT OR REPLACE INTO ${tableName} VALUES (?,?)`),
					i = 0;

				// if (buffer.length < 8000) {
					// console.log(new Float64Array(buffer.buffer, buffer.byteOffset, buffer.length / Float64Array.BYTES_PER_ELEMENT), buffer.length);
				// }

				while (i < buffer.byteLength) {
					stmt.run([buffer.readDoubleLE(i, true), buffer.slice(i, i += rowLength)]);
				}

				stmt.finalize();

				this._db.run('END TRANSACTION', (err) => {
					if (err)
						return reject(err);

					winston.info(`DataLayer: Wrote ${buffer.length / rowLength} candles to ${tableName} took ${Date.now() - now}  ms`);
					resolve();
				});
			});
		});
	}

	public createInstrumentTables(symbols: Array<string>): Promise<any> {
		return new Promise((resolve, reject) => {
			let timeFrames = Object.keys(timeFrameSteps);

			winston.info('DataLayer: Creating ' + symbols.length * timeFrames.length + ' tables');

			if (symbols.length) {
				this._db.serialize(() => {

					symbols.forEach(symbol => {
						timeFrames.forEach(timeFrame => {
							this._db.run(`CREATE TABLE IF NOT EXISTS ${this._getTableName(symbol, timeFrame)} (time INTEGER PRIMARY KEY, data blob);`, err => {
								reject(err);
							});
						});
					});

					resolve();
				});
			}
		});
	}

	public async reset(symbol?: string, timeFrame?: string, from?: number, until?: number): Promise<void> {
		await this._closeDb();

		if (fs.existsSync(this.options.path))
			fs.unlinkSync(this.options.path);

		await this._openDb();
	}

	private _setTableList() {
		return new Promise((resolve, reject) => {
			this._db.run(`.tables`, (err: any, tableList: Array<any>) => {
				this._tableList = tableList;
				resolve();
			});
		});
	}

	private _getTableName(symbol, timeFrame): string {
		return symbol.toLowerCase() + '_' + timeFrame.toLowerCase();
	}

	private async _openDb() {
		return new Promise((resolve, reject) => {
			this._db = new sqLite.Database(this.options.path);
			this._db.configure('busyTimeout', 2000);
			this._db.run('PRAGMA busy_timeout = 60000', (err) => {
				if (err)
					return reject(err);

				resolve();
			});
		});

	}

	private _closeDb() {
		return new Promise((resolve, reject) => {
			this._db.close((err) => {
				if (err)
					return reject(err);

				resolve();
			});
		});

	}
}