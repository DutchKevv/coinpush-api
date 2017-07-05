interface IDrawBufferSettings {
	id: string,
	type: string,
	data?: Array<any>,
	style?: { color?: string, width?: number }
}

export default class Indicator {

	protected drawBuffers: Array<any> = [];

	constructor(protected ticks, protected options = <any>{}) {
		this.init();
	}

	async init(): Promise<any> {}

	add(id, time, data): void {
		this.getById(id).data.push([time, data]);
	}

	public addDrawBuffer(settings: IDrawBufferSettings): void {
		if (this.getById(settings.id))
			throw new Error(`Buffer with name [${settings.id}] already exists`);

		settings.data = settings.data || [];
		this.drawBuffers.push(settings);
	}

	public getDrawBuffersData(count = 1, offset = 0, from?: number, until?: number): {} {
		return this.drawBuffers.map(db => (<IDrawBufferSettings>{
			id: db.id,
			type: db.type,
			style: db.style,
			data: this._getDrawBufferData(db.id, count, offset, from, until)
		}));
	}

	public getById(id: string|number) {
		return this.drawBuffers.find(db => db.id === id);
	}

	private _getDrawBufferData(id: string|number, count: number, offset: number, from: number, until: number) {
		let data = this.getById(id).data,
			start, end;

		if ((from && until) || (count && from)) {
			start = data.findIndex(point => point >= from);
			end = until ? data.lastIndexOf(point => point < until) : Math.min(data.length, start + count);
		}
		else {
			end = Math.max(data.lastIndexOf(point => point < until), data.length - 1);
			start = Math.max(0, Math.max(0, end - count));
		}

		return data.slice(start, end);
	}

	_doCatchUp(): void {
		let len = this.ticks.length,
			i = 0, tick;

		for (; i < len; i++) {
			tick = this.ticks[i];
			this.onTick(tick[0], tick[1], len - i);
		}
	}

	onTick(bid: number, ask: number, shift = 0): Promise<any> | void {
	}
}