import {
	Component, AfterViewInit, Input, Output, OnInit, PipeTransform, Pipe,
	ChangeDetectionStrategy, NgZone, ElementRef, ViewEncapsulation, OnChanges, EventEmitter
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
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class BacktestComponent implements AfterViewInit, OnInit, OnChanges {

	@Input() public models: Array<InstrumentModel> = [];

	public activeGroupId = null;

	constructor(private _elementRef: ElementRef,
				public instrumentService: InstrumentsService) {}

	ngOnInit() {
		this.instrumentService.instruments$.subscribe(() => this.updateModels());
		this.instrumentService.changed$.subscribe(() => this._updateMainProgressBar());
		this._updateMainProgressBar();
	}

	ngAfterViewInit(): void {

	}

	ngOnChanges(){
		alert('chagnes!');
	}

	selectTab(groupId) {
		this.activeGroupId = groupId;
		this.updateModels();
	}

	updateModels() {
		if (this.activeGroupId === null)
			this.activateHighest();

		this.models = this.instrumentService.instruments.filter(model => model.options.groupId === this.activeGroupId);
	}

	activateHighest() {
		let highestGroupId = Math.max.apply(Math, this.instrumentService.instruments.map(model => model.options.groupId || 0));

		if (highestGroupId === -Infinity) {
			highestGroupId = null;
		}

		this.activeGroupId = highestGroupId;
	}

	private _updateProgressBar(type: string, text = '', progress = 0): void {
		requestAnimationFrame(() => {
			let elProgressBar = this._elementRef.nativeElement.shadowRoot.querySelector('.progress-bar');

			if (!elProgressBar)
				return;

			elProgressBar.previousElementSibling.textContent = text;
			elProgressBar.classList.remove(...['info', 'success', 'error'].map(str => 'bg-' + str));
			elProgressBar.classList.add('bg-' + type);
			elProgressBar.style.width = progress + '%';
		});
	}

	private _updateMainProgressBar(): void {

		// Set 'global' progress bar
		let totalProgress = 0,
			totalFinished = 0,
			state = 'success';

		this.models.forEach((model: InstrumentModel) => {
			totalProgress += +model.options.status.progress || 0;

			if (model.options.status.type === 'finished')
				totalFinished++;

			if (model.options.status.type === 'warning') {
				state = 'warning';
			}

			if (model.options.status.type === 'error') {
				state = 'error';
			}
		});


		// console.log('otaotalsa;dfsf', this.models.length, totalProgress);
		totalProgress = <any>((totalProgress / (this.models.length * 100)) * 100).toFixed(2);

		if (totalFinished === this.models.length)
			return this._updateProgressBar(state, `Finished`, 100);

		this._updateProgressBar(state, `Running ${totalProgress}%`, totalProgress);
	}
}