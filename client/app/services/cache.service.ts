import {Injectable, NgZone, Output} from '@angular/core';
import {SocketService} from './socket.service';
import {BehaviorSubject} from 'rxjs';
import CacheMap from '../../../shared/classes/cache/CacheMap';
import {SystemState} from '../../../shared/models/SystemState';
import {Base} from '../../../shared/classes/Base';

export class CacheSymbol extends Base {
	public price$: BehaviorSubject<any> = new BehaviorSubject(this.options);

	public tick(tick) {
		let data = {
			direction: this.options.bid > tick.bid ? 'down' : 'up',
			bidDirection: this.options.bid > tick.bid ? 'down' : 'up',
			bid: tick.bid,
			askDirection: this.options.ask > tick.ask ? 'down' : 'up',
			ask: tick.ask
		};

		this.set(data);
		this.price$.next(data);
	}
}

@Injectable()
export class CacheService {

	@Output() public symbolList$: BehaviorSubject<any> = new BehaviorSubject([]);
	private _mapper: CacheMap;

	constructor(private _zone: NgZone,
				private _socketService: SocketService) {
	}

	public init(): void {
		this._mapper = new CacheMap();

		this._loadSymbolList();

		this._socketService.socket.on('system:state', (systemState: SystemState) => {
			if (!systemState.booting && systemState.connected) {
				this._loadSymbolList();
			}
		});

		this._socketService.socket.on('ticks', (ticks) => {
			this._zone.runOutsideAngular(() => {
				ticks.forEach(tick => {
					let symbol = this.getBySymbol(tick.instrument);

					if (symbol)
						symbol.tick(tick);
				});
			});
		});
	}

	private _loadSymbolList() {
		this._socketService.socket.emit('cache:symbol:list', {}, (err, symbolList) => {
			if (err)
				return console.error(err);

			// Create symbol class for each symbol
			let cacheSymbols = symbolList.map(symbol => {
				return new CacheSymbol({
					name: symbol.name,
					bidDirection: '',
					bid: symbol.bid,
					ask: symbol.ask,
					askDirection: ''
				});
			});

			this.symbolList$.next(cacheSymbols);
		});
	}

	public add(model) {
		return model;
	}

	public getBySymbol(symbol: string) {
		return this.symbolList$.getValue().find(_symbol => _symbol.options.name === symbol)
	}
}