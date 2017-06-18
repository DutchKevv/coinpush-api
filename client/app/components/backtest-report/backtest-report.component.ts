import {
	Component, AfterViewInit, ElementRef, Input, Output, OnInit, ChangeDetectionStrategy,
	OnDestroy, ViewEncapsulation
} from '@angular/core';
import {InstrumentModel} from '../../../../shared/models/InstrumentModel';
import {SocketService} from '../../services/socket.service';
import {InstrumentsService} from '../../services/instruments.service';

@Component({
	selector: 'backtest-report',
	templateUrl: './backtest-report.component.html',
	styleUrls: ['./backtest-report.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class BacktestReportComponent implements AfterViewInit, OnInit, OnDestroy {

	@Input() public models: Array<InstrumentModel> = [];

	public loading = false;

	private _elProgressBar: HTMLElement = null;

	constructor(private _elementRef: ElementRef,
				private _socketService: SocketService) {
	}

	ngOnInit() {
		this.models.forEach(model => {
			model.options$.subscribe(() => this._onStatusUpdate(model))
		});

		// this._socketService.socket.on('instrument:status', (status) => this._onStatusUpdate(status));
	}

	ngAfterViewInit(): void {
		this._elProgressBar = this._elementRef.nativeElement.querySelector('.progress-bar');
	}

	clear() {
		// this.models = [];
	}

	private _updateProgressBar(type: string, text = '', value = 0, elProgressBar = this._elProgressBar) {
		requestAnimationFrame(() => {
			elProgressBar.previousElementSibling.textContent = text;
			elProgressBar.classList.toggle('active', value && value < 100);
			elProgressBar.classList.remove(...['info', 'success', 'error'].map(str => 'progress-bar-' + str));
			elProgressBar.classList.add('progress-bar-' + type);
			elProgressBar.style.width = value + '%';
		});
	}

	private _onStatusUpdate(model: InstrumentModel) {
		let elProgressBar = this._elementRef.nativeElement.querySelector(`[data-id=${model.options.id}] .progress-bar`);

		if (!elProgressBar)
			return;

		switch (model.options.status.type) {
			case 'fetching':
				this._updateProgressBar('info', model.options.status.value + '%', model.options.status.value, elProgressBar);
			case 'running':
				this._updateProgressBar('success', model.options.status.value + '%', model.options.status.value, elProgressBar);
				break;
			case 'finished':
				// console.log(status.report);
				this._updateProgressBar('success', `Finished`, 100, elProgressBar);
				break;
			case 'error':
				this._updateProgressBar('error', `Error`, 100, elProgressBar);
				break;
			case 'default':
				throw new Error('Unknown backtest progress status');
		}
	}

	ngOnDestroy() {

	}
}