import { EventEmitter, Injectable, NgZone, Output } from '@angular/core';
import * as io from 'socket.io-client';
import { SymbolModel } from "../models/symbol.model";
import { SocketService } from "./socket.service";
import { CacheService } from "./cache.service";
import { OrderService } from "./order.service";
import { BehaviorSubject } from "rxjs/BehaviorSubject";

@Injectable()
export class BootstrapService {

	public isReady: boolean = false;

	constructor(
		private _socketService: SocketService,
		private _cacheService: CacheService,
		private _orderService: OrderService) {
	}

	public async loadAppData() {
		this._socketService.connect();
		await this._cacheService.load();

		this.isReady = true;
	}

	public async unloadAppData() {
		this.isReady = false;
	}
}