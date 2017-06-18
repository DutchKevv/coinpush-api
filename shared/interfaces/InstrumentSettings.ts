export interface InstrumentSettings {
	symbol: string;
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
	tickCount?: number;
	graphType?: string;
	autoRun?: boolean;
	orders?: Array<any>;
	type?: string;
	status?: {
		type: string;
		value: any;
	}
}

export default {};