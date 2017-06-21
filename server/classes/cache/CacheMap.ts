import * as fs from 'fs';
import * as path from 'path';
import * as _ from '../../../shared/node_modules/lodash/index';

import {getEstimatedTimeFromCount, mergeRanges, timeFrameSteps} from '../../util/date';

export default class Mapper {

	public static readonly MODE_PERSISTENT = 0;
	public static readonly MODE_MEMORY = 1;

	public streamOpenSince: number = null;

	private _map: any = {};
	private _mode: number;
	private _pathFile: string;

	public get map() {
		return this._map;
	}

	public get mode() {
		return this._mode;
	}

	constructor(private options: any = {}) {
	}

	public async init() {
		if (this.options.path) {
			this._mode = Mapper.MODE_PERSISTENT;
			this._pathFile = path.join(this.options.path, 'database-mapper.json');
			await this._loadFromFile();
		} else {
			this._mode = Mapper.MODE_MEMORY;
		}
	}

	public update(symbol, timeFrame, from, until, count) {
		let map = this.map,
			ranges = this.findByParams(symbol, timeFrame, true);

		if (until === null) {
			console.log(symbol, timeFrame, from, until, count);
		}

		// Find first index of from date that is higher or equal then new chunk from date
		// Place it before that, so all dates are aligned in a forward manner
		let index = _.findIndex(ranges, date => date[0] > from);

		// If one is higher, prepend
		if (index > -1)
			ranges.splice(index, 0, [from, until, count]);

		// Put at end of array, making sure lower from dates stay at the start of array
		else
			ranges.push([from, until, count]);

		// Glue the cached dates together
		map[symbol][timeFrame] = mergeRanges(ranges);

		// Persistent mode
		if (this.mode === Mapper.MODE_PERSISTENT) {
			fs.writeFileSync(this._pathFile, JSON.stringify(map, null, 2));
		}
	}

	public isComplete(symbol, timeFrame, from, until, count?): boolean {
		let ranges = this.findByParams(symbol, timeFrame),
			i = 0, len = ranges.length, _range;

		if (from && until) {
			for (; i < len; ++i) {
				_range = ranges[i];
				if (_range[0] <= from && _range[1] >= until)
					return true;
			}
		} else {

		}

		return false;
	}

	public getPercentageComplete(symbol, timeFrame, from, until, count): number {
		let ranges = this.findByParams(symbol, timeFrame, true),
			totalRequiredTime = from && until ? until - from :  getEstimatedTimeFromCount(timeFrame, count),
			totalStoredTime = 0,
			totalCount = 0,
			result = 0;

		ranges.forEach(range => {
			let _from = range[0],
				_until = range[1],
				_count = range[2];

			// Find all ranges that 'touch' the desired range
			if (_from > until || _until < from)
				return;

			// Exact date range (easy)
			if (from && until) {
				// Correct overflowing ranges
				if (_from < from)
					_from = from;
				if (_until > until)
					_until = until;

				totalStoredTime += _until - _from;
			}

			// Count (hard)
			else {

			}
		});

		// if (from && until) {
			result = (totalStoredTime / totalRequiredTime) * 100;
		// }
		// else {
		//
		// }
		// console.log('totalCount', totalRequiredTime, totalStoredTime, totalCount);

		return +result.toFixed(2);
	}

	public getMissingChunks(symbol, timeFrame, from, until, count) {
		let ranges = this.findByParams(symbol, timeFrame, true),
			result = [{from, until, count}];

		ranges.forEach(range => {
			if (from && until) {
				result = [{from, until, count}];
			}
			else {
				// if ((!from || range[0] <= from) && (!until || range[1] >= until) && range[2] >= count) {
				if ((range[0] <= from) && (range[1] >= until) && range[2] >= count) {
					result = [];
				}
			}
		});

		return result
	}

	public reset(symbol?: string, timeFrame?: string) {

		this._map = {};

		if (this.mode === Mapper.MODE_PERSISTENT) {

			if (fs.existsSync(this._pathFile))
				fs.unlinkSync(this._pathFile);
		}
	}

	public findByParams(symbol: string, timeFrame: string, create = true): Array<any> {
		let map = this.map;

		if (map[symbol])
			if (map[symbol][timeFrame])
				return map[symbol][timeFrame];

		if (create) {
			if (!map[symbol])
				map[symbol] = {};

			if (!map[symbol][timeFrame])
				map[symbol][timeFrame] = [];

			return map[symbol][timeFrame];
		}

		return null;
	}

	getMapInstrumentList(instrument, timeFrame) {
		let map = this.map;

		return map[instrument] && map[instrument][timeFrame] ? map[instrument][timeFrame] : [];
	}

	private _loadFromFile() {

		return new Promise((resolve, reject) => {

			fs.exists(this._pathFile, (result) => {

				if (result) {

					fs.readFile(this._pathFile, (err, content) => {

						try {
							this._map = JSON.parse(content.toString());
						} catch (error) {
							console.warn('Cache: mapping file corrupted');
						}

						resolve();
					});
				} else {
					resolve();
				}
			});
		});
	}
}
