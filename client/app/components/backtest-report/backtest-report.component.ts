import {
	Component, AfterViewInit, ElementRef, Input, Output, OnInit, ChangeDetectionStrategy,
	OnDestroy, ViewEncapsulation, AfterViewChecked, ChangeDetectorRef
} from '@angular/core';
import {InstrumentModel} from '../../../../shared/models/InstrumentModel';
import {SocketService} from '../../services/socket.service';

@Component({
	selector: 'backtest-report',
	templateUrl: './backtest-report.component.html',
	styleUrls: ['./backtest-report.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class BacktestReportComponent implements AfterViewInit, OnInit, OnDestroy, AfterViewChecked {

	@Input() public model: InstrumentModel;

	private _elProgressBar: HTMLElement = null;

	constructor(private _elementRef: ElementRef) {
	}

	ngOnInit() {}

	ngAfterViewInit(): void {
		this._elProgressBar = this._elementRef.nativeElement.shadowRoot.querySelector('.progress-bar');
		this.model.options$.subscribe(() => this._onInstrumentStatusUpdate())
	}

	ngAfterViewChecked() {
		console.log('CHECK!!');
	}

	private _updateProgressBar(type: string, text = '', progress = 0): void {
		requestAnimationFrame(() => {
			this._elProgressBar.previousElementSibling.textContent = text;
			this._elProgressBar.classList.remove(...['info', 'success', 'error'].map(str => 'bg-' + str));
			this._elProgressBar.classList.add('bg-' + type);
			this._elProgressBar.style.width = progress + '%';
		});
	}

	private _onInstrumentStatusUpdate() {
		switch (this.model.options.status.type) {
			case 'fetching':
				this._updateProgressBar('info', (this.model.options.status.progress || 0) + '%', this.model.options.status.progress);
			case 'running':
				this._updateProgressBar('success', (this.model.options.status.progress || 0) + '%', this.model.options.status.progress);
				break;
			case 'finished':
				// console.log(status.report);
				this._updateProgressBar('success', `Finished`, 100);
				break;
			case 'warning':
				this._updateProgressBar('warning', `Warning ${this.model.options.status.progress}%`, 100);
				break;
			case 'error':
				this._updateProgressBar('error', `Error`, 100);
				break;
			case 'default':
				throw new Error('Unknown backtest progress status');
		}
	}

	ngOnDestroy() {
		// this.models.forEach(model => {
		// 	model.options$.unsubscribe();
		// });
	}
}