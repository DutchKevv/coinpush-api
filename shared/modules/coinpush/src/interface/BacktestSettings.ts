export interface IBacktestSettings {
	id?: number;
	totalTime?: number;
	autoRun?: boolean;
	ea?: string;
	symbols?: Array<string>;
	timeFrame?: string;
	from?: number|string | Date;
	until?: number|string | Date;
	startEquality?: number;
	startTime?: number;
	endTime?: number;
	currency?: string;
	ticks?: number;
	ticksPerSecond?: number;
	leverage?: number;
	pips?: number;
}