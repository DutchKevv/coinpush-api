import {Component, OnInit, OnDestroy, Input, AfterViewInit, ElementRef} from '@angular/core';
import {SocketService} from '../../services/socket.service';
import {InstrumentsService} from '../../services/instruments.service';
import {SystemService} from '../../services/system.service';
import {SystemState} from '../../../../shared/models/SystemState';

@Component({
	selector: 'news-list',
	templateUrl: './news-list.html',
	styleUrls: ['./news-list.scss']
})

export class NewsListComponent implements OnDestroy, AfterViewInit {

	@Input() instruments: Array<string> = [];

	private data: any = {};

	constructor(private _socketService: SocketService,
				private _elementRef: ElementRef,
				protected instrumentsService: InstrumentsService) {
	}

	ngAfterViewInit() {
		this.onTick = this.onTick.bind(this);

		this._socketService.socket.on('tick', this.onTick.bind(this));

		this._socketService.socket.on('system:state', (systemState: SystemState) => {
			if (!systemState.booting && systemState.connected) {
				this._load();
			}
		});

		this._bindContextMenu();
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

	private _bindContextMenu() {
		(<any>$(this._elementRef.nativeElement)).contextMenu({
			items: [
				{
					text: 'Create Chart',
					value: 'createChart'
				},
				{
					text: 'Favorite'
				}
			],
			menuSelected: (selectedValue, originalEvent) => {
				let instrument = $(originalEvent.target).parents('[data-symbol]').attr('data-symbol');
				this.instrumentsService.create({instrument: instrument, live: true});
			}
		});
	}

	ngOnDestroy() {
		this._socketService.socket.off('tick', this.onTick);
	}
}