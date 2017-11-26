import {
	Component, AfterViewInit, Input, OnInit, PipeTransform, Pipe, ElementRef, ViewEncapsulation, OnChanges,
	ChangeDetectionStrategy, Output, ViewChild, ChangeDetectorRef
} from '@angular/core';
import {InstrumentModel} from '../../models/instrument.model';
import {InstrumentsService} from '../../services/instruments.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Pipe({name: 'groupIds'})
export class GroupIdsPipe implements PipeTransform {
	transform(value: Array<InstrumentModel>, field: string): Array<any> {
		// alert(JSON.stringify([...new Set(value.filter(val => val.options.type === 'backtest').map(val => val.options.groupId))]));

		return [...<any>new Set(value.filter(val => val.options.type === 'backtest').map(val => val.options.groupId))];
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

	public models: Array<InstrumentModel> = [];
	@Output() public models$ = new BehaviorSubject([]);
	@Output() public progress$ = new BehaviorSubject({status: 'idle', progress: 0});
	@ViewChild('progressBar') _progressBar: ElementRef;

	public activeGroupId = null;

	constructor(public instrumentService: InstrumentsService) {}

	ngOnInit() {

	}

	ngAfterViewInit(): void {
		this.instrumentService.instruments$.subscribe(() => {
			this.activateHighest();
			this.updateModels();
		});

		this.instrumentService.changed$.subscribe(changes => {
			this._updateMainProgressBar();
		});
	}

	ngOnChanges() {
		alert('chagnes!');
	}

	selectTab(groupId): void {
		if (groupId === this.activeGroupId)
			return;

		this.activeGroupId = groupId;
		this.updateModels();
	}

	updateModels(): void {
		if (this.instrumentService.groupIds$.getValue().length === 0)
			return;

		if (this.activeGroupId === null)
			this.activateHighest();

		this.models = this.instrumentService.instruments.filter(model => model.options.groupId === this.activeGroupId);

		this.models$.next(this.models);
		this._updateMainProgressBar();
	}

	activateHighest(): void {
		let highestGroupId = Math.max.apply(Math, this.instrumentService.groupIds$.getValue());

		if (highestGroupId === -Infinity) {
			highestGroupId = null;
		}

		this.activeGroupId = highestGroupId;
	}

	private _updateProgressBar(type: string, text = '', progress = 0): void {
		requestAnimationFrame(() => {
			if (!this._progressBar)
				return;

			this._progressBar.nativeElement.previousElementSibling.textContent = text;
			this._progressBar.nativeElement.classList.remove(...['info', 'success', 'error'].map(str => 'bg-' + str));
			this._progressBar.nativeElement.classList.add('bg-' + type);
			this._progressBar.nativeElement.style.width = progress + '%';
		});
	}

	private _updateMainProgressBar(): void {
		// if (!this._progressBar)
		// 	return;

		this._progressBar.nativeElement.classList.add('animate');

		let totalProgress = 0,
			totalFinished = 0,
			state = 'success';

		this.models.forEach((model: InstrumentModel) => {
			totalProgress += +model.options.status.progress || 0;

			switch (model.options.status.type) {
				case 'finished':
					totalFinished++;
					break;
				case 'warning':
					state = 'warning';
					break;
				case 'error':
					state = 'error';
					break;
			}
		});

		totalProgress = <any>((totalProgress / (this.models.length * 100)) * 100).toFixed(2);

		if (totalFinished === this.models.length) {
			this._updateProgressBar(state, `Finished`, 100);
			this._progressBar.nativeElement.classList.remove('animate');
		} else {
			this._updateProgressBar(state, `Running ${totalProgress}%`, totalProgress);
		}
	}
}