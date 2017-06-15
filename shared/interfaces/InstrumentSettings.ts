export interface InstrumentSettings {
	symbol: string;
	live: boolean;
	id?: string;
	groupId?: number;
	ea?: string;
	timeFrame?: string;
	indicators?: Array<any>;
	from?: number;
	until?: number;
	bars?: Array<any>;
	focus?: boolean;
	zoom?: number;
	startEquality?: number;
	currency?: string;
	leverage?: number;
	pips?: number;
	graphType?: string;
	autoRun?: boolean;
	orders?: Array<any>;

}

export default {};