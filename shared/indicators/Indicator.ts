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

		let db = this.getById(id),
			i = 0, len = db.data.length,
			result = [], point;

		// console.log(db.data[db.data.length - 1], db.data.length, from, until, count,);

		for (; i < len; i++) {
			// if (result.length === count)
			// 	break;

			point = db.data[i];

			if (from && until) {
				if (point[0] >= from && point[0] < until)
					result.push(point);
			} else {
				if (from) {
					if (point[0] >= from)
						result.push(point);
				}
				else {
					// console.log(point[0], until, point[0] < until);
					if (point[0] < until) {
						result.push(point);
					}
				}
			}
		}

		// console.log(result, result.length);
		return result;
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