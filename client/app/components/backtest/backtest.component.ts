import {
	Component, AfterViewInit, Input, Output, OnInit, PipeTransform, Pipe,
	ChangeDetectionStrategy, NgZone, ElementRef, ViewEncapsulation
} from '@angular/core';
import {InstrumentModel} from '../../../../shared/models/InstrumentModel';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {InstrumentsService} from '../../services/instruments.service';
import {SocketService} from '../../services/socket.service';

@Pipe({name: 'groupIds'})
export class GroupIdsPipe implements PipeTransform {
	transform(value: Array<InstrumentModel>, field: string): Array<any> {
		return [...new Set(value.map(val => val.options.groupId))];
	}
}

@Component({
	selector: 'backtest',
	templateUrl: './backtest.component.html',
	styleUrls: ['./backtest.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.Native
})

export class BacktestComponent implements AfterViewInit, OnInit {

	@Input() public models: Array<InstrumentModel> = [];
	@Output() public active$: BehaviorSubject<string|number> = new BehaviorSubject(null);

	private _elProgressBar: HTMLElement = null;

	constructor(private _elementRef: ElementRef,
				public instrumentService: InstrumentsService) {}

	ngOnInit() {
		this._elProgressBar = this._elementRef.nativeElement.querySelector('.progress-bar');

		this.instrumentService.groupIds$.subscribe(groupIds => {
			// if (groupIds.indexOf(this.active$.getValue()) === -1) {
				this.active$.next(groupIds[groupIds.length - 1] || null);
			// }
		});
	}

	ngAfterViewInit(): void {

	}

	clear() {
		// this.models = [];
	}
}