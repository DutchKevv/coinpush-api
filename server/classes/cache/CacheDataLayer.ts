import * as fs          from 'fs';
import {log} 			from '../../../shared/logger';
import {timeFrameSteps} from '../../../shared/util/util.date';
import * as sqLite		from 'sqlite3';

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

	public read(params: {symbol: string, timeFrame: string, from: number, until: number, count: number}): Promise<NodeBuffer> {

		return new Promise((resolve, reject) => {
			let now = Date.now(),
				symbol = params.symbol,
				timeFrame = params.timeFrame,
				from = params.from,
				until = params.until,
				count = params.count,
				oCount = count;

			let tableName = this._getTableName(symbol, timeFrame),
				queryString;

			queryString = `SELECT data FROM ${tableName} `;

			if (count) {
				if (until) {
					queryString += `WHERE time < ${until} ORDER BY time DESC LIMIT ${count} `;
				} else {
					queryString += `WHERE time > ${from} ORDER BY time LIMIT ${count} `;
				}
			} else {
				count = 500;

				if (from && until) {
					queryString += `WHERE time >= ${from} AND time <= ${until} ORDER BY time DESC LIMIT ${count}`;
				}
				else if (from) {
					queryString += `WHERE time >= ${from} ORDER BY time LIMIT ${count}`;
				}
				else {
					queryString += `WHERE time < ${until} ORDER BY time DESC LIMIT ${count}`;
				}
			}

			this._db.all(queryString, (err, rows) => {
				if (err)
					return reject(err);

				if (oCount && until)
					rows = rows.reverse();

				let mergedBuffer = Buffer.concat(rows.map(row => row.data), rows.length * (10 * Float64Array.BYTES_PER_ELEMENT));

				log.info('DataLayer', `Reading ${symbol}-${timeFrame} took ${Date.now() - now} ms`);

				rows = null;

				resolve(mergedBuffer);
			});
		});
	}

	public write(symbol, timeFrame, buffer: NodeBuffer): Promise<any> {

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

				while (i < buffer.byteLength)
					stmt.run([buffer.readDoubleLE(i, true), buffer.slice(i, i += rowLength)]);

				stmt.finalize();

				this._db.run('END TRANSACTION', (err) => {
					if (err)
						return reject(err);

				}, () => {
					let _from = buffer.readDoubleLE(0),
						_until = buffer.readDoubleLE(buffer.length - (10 * Float64Array.BYTES_PER_ELEMENT));

					log.info('DataLayer', `Wrote ${buffer.length / rowLength} candles from ${_from} until ${_until} to ${tableName} took ${Date.now() - now}  ms`);
					resolve();
				});
			});
		});
	}

	public createInstrumentTables(symbols: Array<string>): Promise<any> {
		return new Promise((resolve, reject) => {
			let timeFrames = Object.keys(timeFrameSteps);

			log.info('DataLayer', 'Creating ' + symbols.length * timeFrames.length + ' tables');

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