import * as _ from 'lodash';
import {Directive, ElementRef, OnInit, Input, AfterViewInit} from '@angular/core';
import * as moment from 'moment';

const Highcharts = require('highcharts');

// Themes
import {HighchartsDefaultTheme} from './themes/theme.default';

@Directive({
	selector: '[chart-report]',
	exportAs: 'chart-report'
})

export class ChartReportDirective implements OnInit, AfterViewInit {

	@Input() data: any;
	@Input() height: number;

	public loading: true;
	public chart: any;

	constructor(public elementRef: ElementRef) {}

	ngOnInit() {
	}

	ngAfterViewInit() {
		if (this.height)
			this.setHeight(this.height);

		requestAnimationFrame(() => {
			this._createChart();
		});
	}

	public setHeight(height: number): void {
		height = height || this.elementRef.nativeElement.parentNode.clientHeight;

		this.elementRef.nativeElement.style.height = height + 'px';
	}

	public reflow() {
		requestAnimationFrame(() => {
			this.chart.reflow();
			this._updateZoom();
			// requestAnimationFrame(() => this.chart.reflow())
		});
	}

	private _updateZoom(redraw = true) {
		let parentW = this.elementRef.nativeElement.parentNode.clientWidth,
			data = this.chart.xAxis[0].series[0].data,
			barW = 12.5,
			barsToShow = Math.ceil(parentW / barW),
			firstBar = (data[data.length - barsToShow] || data[0]),
			lastBar = data[data.length - 1];

		this.chart.xAxis[0].setExtremes(firstBar.x, lastBar.x, redraw, false);
	}

	private _createChart(): void {
		let data = this._prepareData(this.data);

		// Clone a new settings object
		let settings = <any>_.cloneDeep(HighchartsDefaultTheme);
		delete settings.chart;

		settings.series = [{
			name: 'base',
			data: data
		}];


		settings.plotOptions.line = {
			marker: {
				enabled: false
			}
		};

		settings.tooltip = {
			useHTML: true,
			formatter: function () {
				return `<ul>
<li> ${this.x}</li>
<li><span>Equality</span>: &euro; ${this.y}</li>
<li><span>open</span>: ${moment.unix(this.point.data.openTime / 1000).format('DD MMM YY hh:mm:ss')}</li>
<li><span>close</span>: ${moment.unix(this.point.data.closeTime / 1000).format('DD MMM YY hh:mm:ss')}</li>
<li><span>CloseValue</span>: &euro; ${this.point.data.closeValue}</li>
<li><span>Profit</span>: &euro; ${this.point.data.profit.toFixed(2)}</li>
</ul>`;
			}
		};

		settings.xAxis[0].tickInterval = 1;
		settings.xAxis[0].gridLineWidth = 0;
		settings.xAxis[0].labels = {
			formatter: function () {
				return this.value;
			}
		};
		// settings.xAxis[0].dataGrouping.enabled = false;

		settings.yAxis = <any>[
			{
				title: {
					enabled: false
				},
				labels: {
					enabled: true,
					// step: 1
				},
				tickInterval: 1,
				height: '73%',
				borderWidth: 3,
				borderColor: '#FF0000'
			}
		];

		this.chart = Highcharts.chart(this.elementRef.nativeElement, settings);
	}


	private _prepareData(data) {
		return data.map(order => ({y: order.equality, data: order}));
	}
}

