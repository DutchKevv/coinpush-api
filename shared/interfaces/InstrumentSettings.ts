export interface InstrumentSettings {
	symbol: string;
	id?: string;
	groupId?: number;
	ea?: string;
	timeFrame?: string;
	indicators?: Array<any>;
	from?: number;
	until?: number;
	candles?: Array<any>;
	focus?: boolean;
	zoom?: number;
	startEquality?: number;
	currency?: string;
	leverage?: number;
	pips?: number;
	graphType?: string;
	autoRun?: boolean;
	orders?: Array<any>;
	type?: string;
	status?: {
		type: string;
		progress: number;
		tickCount: number;
		ticksPerSecond: number;
		totalFetchTime: number;
		startTime: number;
		endTime: number;
	}
}

export default {};