import Indicator from '../Indicator';

export default class MA extends Indicator {

	public get value() {
		return this.getDrawBuffersData(undefined, undefined, false)['MA'].data[0][1];
	}

	public async init(): Promise<any> {

		this.addDrawBuffer({
			id: 'MA',
			type: 'line',
			style: {
				color: this.options.color
			}
		});
	}

	public onTick(bid: number, ask: number, shift = 0): Promise<any> | void {

	}
}