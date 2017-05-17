import {Component, OnInit, OnDestroy, ElementRef} from '@angular/core';
import {SocketService} from '../../services/socket.service';
import {InstrumentsService} from '../../services/instruments.service';

@Component({
	selector: 'instrument-list',
	templateUrl: './instrument-list.component.html',
	styleUrls: ['./instrument-list.component.scss']
})

export class InstrumentListComponent implements OnDestroy, OnInit {

	public data: any = {};

	constructor(public instrumentService: InstrumentsService,
				private _socketService: SocketService,
				private _elementRef: ElementRef) {
	}

	ngOnInit() {
		this._socketService.socket.on('tick', this.onTick.bind(this));

		this._bindContextMenu();
	}

	onTick(tick) {
		tick.direction = this.data[tick.instrument] && this.data[tick.instrument].bid > tick.bid ? 'down' : 'up';

		this.data[tick.instrument] = tick;
	}

	private _bindContextMenu() {
		$(this._elementRef.nativeElement).contextMenu({
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
				this.instrumentService.create({instrument: instrument, live: true});
			}
		});
	}

	ngOnDestroy() {
		this._socketService.socket.off('tick', this.onTick);
	}
}