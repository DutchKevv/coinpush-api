import {BaseModel} 					from '../models/BaseModel';

export class OrderModel extends BaseModel {

	public symbolHandle: any;

	public static readonly DEFAULTS = {
		user: null,
		channel: null,
		type: null,
		amount: 0,
		symbol: null,
		stopLoss: 0,
		takeProfit: 0,
		magic: 0,
		profit: 0,
		profitPerc: 0
	};
}