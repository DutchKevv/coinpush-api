import {
	Component, AfterViewInit, ElementRef, Input, OnInit, ChangeDetectionStrategy,
	OnDestroy, ViewEncapsulation, AfterViewChecked, NgZone, ViewChild
} from '@angular/core';
import {InstrumentModel} from '../../models/instrument.model';
const CanvasJS = require('../../../assets/vendor/js/canvasjs/canvasjs.min');
import {minBy, maxBy} from 'lodash';

declare let Module: any;

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
	// @ViewChild('chart2') chart2Ref: ElementRef;

	public Math = Math;

	private _elProgressBar: HTMLElement = null;
	private _chart: any = null;

	constructor(private _zone: NgZone,
				private _elementRef: ElementRef) {
	}

	ngOnInit() {}

	ngAfterViewInit(): void {
		this.updateCanvasSize();
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

	updateCanvasSize() {
		let currentWidth = parseInt(this.chartRef.nativeElement.getAttribute('width'), 10),
			parentWidth = parseInt(this.chartRef.nativeElement.parentNode.clientWidth, 10) - 2;

		if (currentWidth !== parentWidth)
			this.chartRef.nativeElement.setAttribute('width', parentWidth);
	}

	private _createChart(): void {
		this._zone.runOutsideAngular(async () => {
			await Module.custom.updateInstrument(this.model.options.id, {orders: this._prepareData()});
			let id = await Module.custom.addChart(this.model.options.id, this.chartRef.nativeElement);
			await Module.custom.renderChart(id);
		});
	}

	private _updateData(data) {
		this._zone.runOutsideAngular(() => {
			Module.custom.updateInstrument(this.model.options.id, this._prepareData(data));

			if (!this._chart)
				return;

			let arr = this._chart.options.data[0].dataPoints;

			// Update orders
			arr.push(...this._prepareData(data));

			this._chart.options.axisY.minimum = Math.floor((<any>minBy(arr, 'y')).y * 0.99);
			this._chart.options.axisY.maximum = Math.ceil((<any>maxBy(arr, 'y')).y * 1.01);

			this._chart.render();
		});
	}

	private _onInstrumentStatusUpdate() {

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
		data = data || this.model.options.orders;

		return data.map(order => ({x: new Date(order.closeTime), y: order.closeEquality, id: order.id, profit: order.profit.toFixed(2), type: order.type}));
	}

	ngOnDestroy() {
		Module.custom.destroyChart(this.model.options.id);
		// this.models.forEach(model => {
		// 	model.options$.unsubscribe();
		// });
	}
}