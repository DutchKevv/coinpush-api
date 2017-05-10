import {Component, OnInit, OnDestroy, Input} from '@angular/core';
import {SocketService} from '../../services/socket.service';
import {InstrumentsService} from '../../services/instruments.service';
import {SystemService} from '../../services/system.service';
import {SystemState} from '../../../../shared/models/SystemState';

@Component({
	selector: 'instrument-list',
	templateUrl: './instrument-list.component.html',
	styleUrls: ['./instrument-list.component.scss']
})

export class InstrumentListComponent implements OnInit, OnDestroy {

	@Input() instruments: Array<string> = [];

	private data: any = {};

	constructor(private _socketService: SocketService,
				protected instrumentsService: InstrumentsService) {
	}

	ngOnInit() {
		this.onTick = this.onTick.bind(this);

		this._socketService.socket.on('tick', this.onTick.bind(this));

		this._socketService.socket.on('system:state', (systemState: SystemState) => {
			if (!systemState.booting && systemState.connected && Object.keys(this.data).length === 0) {
				this._load();
			}
		});
	}

	onTick(tick) {
		tick.direction = this.data[tick.instrument] && this.data[tick.instrument].bid > tick.bid ? 'down' : 'up';

		this.data[tick.instrument] = tick;
	}

	private _load() {
		this._socketService.socket.emit('instrument:list', {}, (err, instrumentList) => {
			if (instrumentList.length)
				this.instruments = instrumentList.map(instrument => instrument.instrument);
			else
				alert('Empty instrument list received!');
		});
	}

	ngOnDestroy() {
		this._socketService.socket.off('tick', this.onTick);
	}
}