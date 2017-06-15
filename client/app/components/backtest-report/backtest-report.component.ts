import {Component, AfterViewInit, ElementRef, Input} from '@angular/core';
import {InstrumentModel} from '../../../../shared/models/InstrumentModel';

@Component({
	selector: 'backtest-report',
	templateUrl: './backtest-report.component.html',
	styleUrls: ['./backtest-report.component.scss']
	// changeDetection: ChangeDetectionStrategy.OnPush
})

export class BacktestReportComponent implements AfterViewInit {

	@Input() models: Array<InstrumentModel> = [];

	public loading = false;

	constructor(private elementRef: ElementRef) {
		console.log('KEWINDSFKN', this.models);
	}

	ngAfterViewInit(): void {
	}

	toggleLoading(state: boolean) {
		this.loading = state;

		if (state)
			this.clear();
	}

	clear() {
		this.models = [];
	}
}