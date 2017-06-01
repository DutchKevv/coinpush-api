import {EventEmitter}   from 'events';
import * as moment      from 'moment';
import * as path        from 'path';

const colors = require('colors/safe');
const Table = require('cli-table');
const timeSpan = require('readable-timespan');

timeSpan.set({
	lessThanFirst: 'now',
	millisecond: 'ms',
	second: 's',
	minute: 'm',
	hour: 'h',
	day: 'd',
	week: 'w',
	month: 'mo',
	year: 'y',
	space: true,
	pluralize: false
});

export default class BackTest extends EventEmitter {

	instruments: any;
	timeFrame: string;
	from: number;
	until: number;

	startTime = null;
	endTime = null;
	report: any = {};

	EAs = [];

	constructor(protected app, protected options) {
		super();

		this.instruments = this.options.instruments;
		this.timeFrame = this.options.timeFrame;
		this.from = this.options.from;
		this.until = this.options.until;
	}

	async run() {
		let EAPath = path.join(this.app.controllers.config.config.path.custom, 'ea', this.options.ea, 'index');

		this.startTime = Date.now();

		// Ensue cache has all the data
		await Promise.all(this.instruments.map(instrument => {
			return this.app.controllers.cache.fetch(instrument, this.timeFrame, this.from, this.until);
		}));

		// Create instrument instances
		this.EAs = await Promise.all(this.instruments.map(instrument => {

			return this.app.controllers.instrument.create(instrument, this.timeFrame, false, EAPath, {
				leverage: this.options.leverage,
				equality: this.options.equality,
				from: this.from,
				until: this.until
			});
		}));

		// Wait until all have finished
		await Promise.all(this.EAs.map(EA => {

			return new Promise((resolve, reject) => {

				EA.worker._ipc.on('@run:end', resolve);

				EA.worker.send('@run', undefined, false);
			});
		}));

		this.endTime = Date.now();

		this.report = await this.getReport();

		this._logReport(this.report);

		return this.report;
	}

	async getReport() {
		let totalTime = this.endTime - this.startTime,
			totalFetchTime = 0,
			totalTestTime = 0,
			totalTicks = 0,
			totalTicksPerSecond = 0,
			ticksPerSecond,
			instrumentReports = await this.getInstrumentReports();

		instrumentReports.forEach(report => {
			totalTicks += report.ticks;
			totalTicksPerSecond += report.ticksPerSecond;
			totalFetchTime += report.time.fetch;
			totalTestTime += report.time.test;
		});

		ticksPerSecond = Math.round(totalTicks / (totalTestTime / 1000));

		return {
			startEquality: this.options.equality,
			diff: 0,
			timeFrame: this.timeFrame,
			from: this.from,
			fromPretty: moment(this.from).format('MMM Do YYYY hh:mm:ss'),
			until: this.until || 0,
			untilPretty: moment(this.until).format('MMM Do YYYY hh:mm:ss'),
			ticks: totalTicks,
			ticksPretty: totalTicks.toLocaleString(),
			ticksPerSecond: ticksPerSecond,
			ticksPerSecondPretty: ticksPerSecond.toLocaleString(),
			instruments: instrumentReports,
			nrOfTrades: 0,
			time: {
				fetching: totalFetchTime,
				fetchingPretty: timeSpan.parse(totalFetchTime),
				testing: totalTestTime,
				testingPretty: timeSpan.parse(totalTestTime),
				total: totalTime,
				totalPretty: timeSpan.parse(totalTime)
			}
		};
	}

	getInstrumentReports() {

		return Promise.all(this.EAs.map(async (EA) => {

			let report = await EA.worker.send('@report');

			let totalTime = (report.data.endTime - report.data.startTime),
				ticksPerSecond = Math.round(report.tickCount / (totalTime / 1000));

			return {
				id: EA.id,
				equality: report.equality.toFixed(2),
				diff: (report.equality - this.options.equality).toFixed(2),
				orders: report.orders,
				nrOfTrades: report.orders.length,
				instrument: EA.instrument,
				timeFrame: this.timeFrame,
				from: this.from,
				fromPretty: new Date(this.from),
				until: this.until,
				untilPretty: new Date(this.until),
				ticks: report.tickCount,
				ticksPretty: report.tickCount.toLocaleString(),
				ticksPerSecond: ticksPerSecond,
				ticksPerSecondPretty: ticksPerSecond.toLocaleString(),
				time: {
					start: report.data.startTime,
					end: report.data.endTime,
					fetch: report.data.totalFetchTime,
					test: totalTime - report.data.totalFetchTime,
					total: totalTime,
					totalPretty: timeSpan.parse(totalTime)
				}
			}
		}));
	}

	_logReport(report) {

		// instantiate
		let table = new Table({
			head: ['Name', 'Profit', 'Nr. Trades', 'Nr. Ticks'],
			// colWidths: [150, 150, 150, 150]
		});

		// table is an Array, so you can `push`, `unshift`, `splice` and friends
		table.push(...this.report.instruments.map(instrumentReport => [
			instrumentReport.instrument,
			instrumentReport.diff,
			instrumentReport.nrOfTrades,
			instrumentReport.ticksPretty
		]));

		console.info(`\n
            All instruments on time-frame ${colors.white(report.timeFrame)} finished Successfully.

${table.toString()}
            
            Time    : ${report.timePretty}
            Period  : ${report.fromPretty} until ${report.untilPretty}
            equality: ?

            ${colors.white(`
                Ticks    : ${report.ticksPretty}
                Ticks p/s: ${report.ticksPerSecondPretty}\n
            `)}
	`);
	}
}