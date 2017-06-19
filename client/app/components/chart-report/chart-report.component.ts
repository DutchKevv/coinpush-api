import {
	ElementRef, OnInit, Input, AfterViewInit, NgZone, Component,
	ChangeDetectionStrategy, ViewEncapsulation, Output, ViewChild, OnDestroy
} from '@angular/core';
import {cloneDeep} from 'lodash';
import {InstrumentModel} from '../../../../shared/models/InstrumentModel';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

const CanvasJS = require('../../../assets/vendor/js/canvasjs/canvasjs.min');

@Component({
	selector: 'chart-report',
	exportAs: 'chart-report',
	styleUrls: ['./chart-report.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	templateUrl: './chart-report.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})

export class ChartReportComponent implements OnInit, AfterViewInit, OnDestroy {

	@Input() model: InstrumentModel;
	@Input() height: number;
	@ViewChild('chart') chartRef: ElementRef;

	private _chart: any;
	private _data: Array<{y: number}> = [];

	constructor(private _zone: NgZone,
				public elementRef: ElementRef) {}

	ngOnInit() {

	}

	ngAfterViewInit() {
		if (this.height)
			this.setHeight(this.height);

		this._createChart();

		this.model.changed$.subscribe((changes: any) => {
			if (changes.orders && changes.orders.length) {
				this._updateData(changes.orders);
			}
		});
	}

	public setHeight(height: number): void {
		height = height || this.elementRef.nativeElement.parentNode.clientHeight;

		this.elementRef.nativeElement.style.height = height + 'px';
	}

	public reflow() {
		requestAnimationFrame(() => {
			this._chart.reflow();
			this._updateZoom();
			// requestAnimationFrame(() => this.chart.reflow())
		});
	}

	private _updateZoom(redraw = true) {
		let parentW = this.elementRef.nativeElement.parentNode.clientWidth,
			data = this._chart.xAxis[0].series[0].data,
			barW = 12.5,
			barsToShow = Math.ceil(parentW / barW),
			firstBar = (data[data.length - barsToShow] || data[0]),
			lastBar = data[data.length - 1];

		this._chart.xAxis[0].setExtremes(firstBar.x, lastBar.x, redraw, false);
	}

	private _createChart(): void {
		this._zone.runOutsideAngular(() => {
			this._chart = new window['CanvasJS'].Chart(this.chartRef.nativeElement,
				{
					backgroundColor: "#000",
					axisX: {
						labelFontColor: "#fff",
						gridDashType: "dash",
						gridColor: '#787D73',
						gridThickness: 1
					},
					axisY: {
						labelFontColor: "#fff",
						gridDashType: "dash",
						gridColor: '#787D73',
						gridThickness: 1,
						interval: 2000
					},
					data: [
						{
							type: "line",
							dataPoints: this._prepareData()
						}
					]
				});

			this._chart.render();
		});
	}

	private _updateData(data) {
		this._zone.runOutsideAngular(() => {

			this._chart.options.data[0].dataPoints = this._prepareData();
			this._chart.render();
		});
	}

	private _prepareData() {
		return this.model.options.orders.map((order, i) => ({y: order.equality}));
	}

	ngOnDestroy() {
		this._zone.runOutsideAngular(() => {
			this._chart.destroy();
		});
	}
}