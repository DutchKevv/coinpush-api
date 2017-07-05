import {
	Component, AfterViewInit, ElementRef, Input, OnInit, ChangeDetectionStrategy,
	OnDestroy, ViewEncapsulation, AfterViewChecked, NgZone, ViewChild
} from '@angular/core';
import {InstrumentModel} from '../../../../shared/models/InstrumentModel';
const CanvasJS = require('../../../assets/vendor/js/canvasjs/canvasjs.min');
import {minBy, maxBy} from 'lodash';
import * as moment from 'moment';

@Component({
	selector: 'backtest-report',
	templateUrl: './backtest-report.component.html',
	styleUrls: ['./backtest-report.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class BacktestReportComponent implements AfterViewInit, OnInit, OnDestroy, AfterViewChecked {

	@Input() public model: InstrumentModel;
	@ViewChild('chart') chartRef: ElementRef;

	public Math = Math;

	private _elProgressBar: HTMLElement = null;
	private _chart: any = null;

	constructor(private _zone: NgZone,
				private _elementRef: ElementRef) {
	}

	ngOnInit() {

	}

	ngAfterViewInit(): void {
		this._createChart();

		this._elProgressBar = this._elementRef.nativeElement.shadowRoot.querySelector('.progress-bar');
		this.model.changed$.subscribe((changes: any) => {
			if (changes.status)
				this._onInstrumentStatusUpdate();

			if (changes.orders && changes.orders.length)
				this._updateData(changes.orders);
		});
		this._onInstrumentStatusUpdate();
	}

	ngAfterViewChecked() {
		// console.log('CHECK!!');
	}

	private _createChart(): void {
		this._zone.runOutsideAngular(() => {
			this._chart = new window['CanvasJS'].Chart(this.chartRef.nativeElement,
				{
					backgroundColor: '#000',
					axisX: {
						includeZero: false,
						labelFontColor: '#fff',
						gridDashType: 'dash',
						gridColor: '#787D73',
						gridThickness: 1,
						tickThickness: 0
					},
					axisY: {
						includeZero: false,
						labelFontColor: '#fff',
						gridDashType: 'dash',
						gridColor: '#787D73',
						gridThickness: 1,
						tickThickness: 0
						// minimum: this.model.options.startEquality
					},
					data: [
						{
							type: 'line',
							dataPoints: this._prepareData(),
							markerSize: 6,
						}
					]
				});

			// this._chart.options.axisY.minimum = this.model.options.startEquality;
			this._chart.render();
		});
	}

	private _updateData(data) {
		this._zone.runOutsideAngular(() => {
			let arr = this._chart.options.data[0].dataPoints;

			// Update orders
			arr.push(...this._prepareData(data));

			this._chart.options.axisY.minimum = Math.floor(minBy(arr, 'y').y * 0.99);
			this._chart.options.axisY.maximum = Math.ceil(maxBy(arr, 'y').y * 1.01);

			this._chart.render();
		});
	}

	private _onInstrumentStatusUpdate() {
		console.log(this.model.options.status);

		switch (this.model.options.status.type) {
			case 'fetching':
				this._updateProgressBar('info', (this.model.options.status.progress || 0) + '%', this.model.options.status.progress);
				break;
			case 'running':
				this._elProgressBar.classList.add('animate');
				this._updateProgressBar('success', (this.model.options.status.progress || 0) + '%', this.model.options.status.progress);
				break;
			case 'finished':
				this._elProgressBar.classList.remove('animate');
				// console.log(status.report);
				this._updateProgressBar('success', `Finished`, 100);
				break;
			case 'warning':
				this._updateProgressBar('warning', `Warning ${this.model.options.status.progress}%`, 100);
				break;
			case 'error':
				this._elProgressBar.classList.remove('animate');
				this._updateProgressBar('error', `Error`, 100);
				break;
			case 'default':
				throw new Error('Unknown backtest progress status');
		}
	}

	private _updateProgressBar(type: string, text = '', progress = 0): void {
		// requestAnimationFrame(() => {
			this._elProgressBar.previousElementSibling.textContent = text;
			this._elProgressBar.classList.remove(...['info', 'success', 'error'].map(str => 'bg-' + str));
			this._elProgressBar.classList.add('bg-' + type);
			this._elProgressBar.style.width = progress + '%';
		// });
	}

	private _prepareData(data?) {
		let i = data ? this._chart.options.data[0].dataPoints.length : 0;

		data = data || this.model.options.orders;

		return data.map(order => ({x: ++i, y: order.equality}));
	}

	ngOnDestroy() {
		// this.models.forEach(model => {
		// 	model.options$.unsubscribe();
		// });
	}
}