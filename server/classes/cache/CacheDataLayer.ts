import * as fs          from 'fs';
import * as sqLite      from 'sqlite3';
import * as winston     from 'winston-color';
import {timeFrameSteps} from "../../util/date";

const TransactionDatabase = require('sqlite3-transactions').TransactionDatabase;

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

	public read(instrument: string, timeFrame: string, from: number, until: number, count: number, bufferOnly = true): Promise<Float64Array> {

		return new Promise((resolve, reject) => {

			let tableName = this._getTableName(instrument, timeFrame),
				queryString;

			winston.info(`DataLayer: Read ${tableName} from ${new Date(from)} until ${new Date(until)} count ${count}`);

			queryString = `SELECT data FROM ${tableName} `;

			if (count) {
				if (until) {
					queryString += `WHERE time <= ${until} ORDER BY time LIMIT ${count} `;
				} else {
					queryString += `WHERE time >= ${from} ORDER BY time LIMIT ${count} `;
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

	public async write(instrument, timeFrame, buffer: NodeBuffer) {

		return new Promise((resolve, reject) => {
			if (!buffer.length)
				return resolve();

			let tableName = this._getTableName(instrument, timeFrame),
				rowLength = 10 * Float64Array.BYTES_PER_ELEMENT;

			this._db.serialize(() => {
				let now;

				this._db.run('BEGIN TRANSACTION', () => {
					now = Date.now();
				});

				let stmt = this._db.prepare(`INSERT OR REPLACE INTO ${tableName} VALUES (?,?)`),
					i = 0;

				if (buffer.length < 8000) {
					console.log(new Float64Array(buffer.buffer, buffer.byteOffset, buffer.length / Float64Array.BYTES_PER_ELEMENT), buffer.length);
				}

				while (i < buffer.byteLength) {
					stmt.run([buffer.readDoubleLE(i, true), buffer.slice(i, i += rowLength)]);
				}

				stmt.finalize();

				this._db.run('END TRANSACTION', () => {
					winston.info(`DataLayer: Wrote ${buffer.length / rowLength} candles to ${tableName} took ${Date.now() - now}  ms`);
					resolve();
				});
			});
		});
	}

	public createInstrumentTables(instruments: Array<string>) {
		return new Promise((resolve, reject) => {
			let timeFrames = Object.keys(timeFrameSteps);

			winston.info('DataLayer: Creating ' + instruments.length * timeFrames.length + ' tables');

			if (instruments.length) {
				this._db.serialize(() => {

					instruments.forEach(instrument => {
						timeFrames.forEach(timeFrame => {
							this._db.run(`CREATE TABLE IF NOT EXISTS ${this._getTableName(instrument, timeFrame)} (time INTEGER PRIMARY KEY, data blob);`, err => {
								reject(err);
							});
						});
					});

					resolve();
				});
			}
		});
	}

	public async reset(instrument?: string, timeFrame?: string, from?: number, until?: number): Promise<void> {
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

	private _getTableName(instrument, timeFrame): string {
		return instrument.toLowerCase() + '_' + timeFrame.toLowerCase();
	}

	private async _openDb() {
		return this._db = new TransactionDatabase(
			new sqLite.Database(this.options.path)
		);
	}

	private _closeDb() {
		this._db.close();
	}
}