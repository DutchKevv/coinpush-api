import {throttle, cloneDeep} from 'lodash';
import {
	ElementRef, OnInit, Input, Component, ChangeDetectionStrategy, OnDestroy, NgZone,
	ViewEncapsulation, AfterViewInit, ViewChild, Output, ChangeDetectorRef
} from '@angular/core';

import {InstrumentsService} from '../../services/instruments.service';
import {InstrumentModel} from '../../../../shared/models/InstrumentModel';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

declare let $: any;

@Component({
	selector: 'chart',
	exportAs: 'chart',
	styleUrls: ['./chart.component.scss'],
	templateUrl: './chart.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.Native
})

export class ChartComponent implements OnInit, AfterViewInit, OnDestroy {
	@Input() type = 'stock';
	@Input() model: InstrumentModel;
	@Input() height: number;
	@Input() offset = 0;
	@Input() chunkLength = 1500;

	@Output() loading$ = new BehaviorSubject(true);

	@ViewChild('chart') chartRef: ElementRef;

	private _scrollOffset = -1;
	private _scrollSpeedStep = 4;
	private _scrollSpeedMin = 1;
	private _scrollSpeedMax = 20;

	private _chart: any;
	private _onScrollBounced: Function = null;

	constructor(private _zone: NgZone,
				private _elementRef: ElementRef,
				private _instrumentsService: InstrumentsService,
				private _ref: ChangeDetectorRef) {
	}

	public async ngOnInit() {

		// Bouncer func to limit onScroll calls
		// this._onScrollBounced = throttle(this._onScroll.bind(this), 16);
		this._onScrollBounced = this._onScroll.bind(this);

		this.model.changed$.subscribe(changes => {
			for (let key in changes) {
				if (changes.hasOwnProperty(key)) {
					switch (key) {
						case 'zoom':
							if (this._chart)
								this._updateViewPort();
							break;
						case 'graphType':
							if (this._chart)
								// this._chart.series[0].update({
								// 	type: changes[key]
								// });
							break;
						case 'timeFrame':
							this.toggleTimeFrame(changes[key]);
							break;
						case 'indicator':
							let change = changes[key];
							if (change.type === 'add') {
								let indicator = this.model.options.indicators.find(i => i.id === change.id);

								this._updateIndicators([indicator]);
							}
							break;
					}
				}
			}
		});
	}

	ngAfterViewInit(): void {
		this._createChart();
	}

	public pinToCorner(edges): void {
		let el = this._chart.container;

		el.style.position = 'absolute';

		if (edges.right || edges.left) {
			el.style.left = 'auto';
			el.style.right = 0;
		}
	}

	public unpinFromCorner(reflow = true): void {
		this._chart.container.style.position = 'static';

		if (reflow)
			this.reflow();
	}

	public reflow() {
		console.log('REFLOW!!');
		this._updateViewPort(false);

		this._chart.options.height = this._elementRef.nativeElement.clientHeight;
		this._chart.options.width = this._elementRef.nativeElement.clientWidth;
		this._chart.render();
	}

	public toggleTimeFrame(timeFrame) {
		// this._toggleLoading(true);
		// this._createChart();
		// this._toggleLoading(false);
	}

	private _createChart() {
		this._zone.runOutsideAngular(() => {
			if (this._chart)
				this._destroyChart();


			this._chart = new window['CanvasJS'].Chart(this.chartRef.nativeElement, {
				exportEnabled: false,
				backgroundColor: '#000',
				axisY: {
					includeZero: false,
					// title: 'Prices',
					// prefix: '$',
					labelFontColor: '#fff',
					labelFontSize: '12',
					gridDashType: 'dash',
					gridColor: '#787D73',
					gridThickness: 1
				},
				axisX: {
					includeZero: false,
					labelFontColor: '#fff',
					labelFontSize: '12',
					gridDashType: 'dash',
					gridColor: '#787D73',
					gridThickness: 1
				},
				/*axisX: {
					interval: 2,
					intervalType: 'month',
					valueFormatString: 'MMM',
					title: 'Month wise Stock Prices for 2012 - 2013',
				},*/
				data: [
					{
						type: 'candlestick',
						connectNullData: true,
						risingColor: '#17EFDA',
						dataPoints: []
					}
				]
			});

			// this._chart.axisX[0].set('interval', 1)

			if (this.model.options.id) {
				this._fetch(this.chunkLength, this.offset);
			} else {
				let subscription = this.model.changed$.subscribe(() => {
					if (this.model.options.id) {
						subscription.unsubscribe();
						this._fetch(this.chunkLength, this.offset);
					}
				});
			}

			this._chart.render();
			this.chartRef.nativeElement.addEventListener('mousewheel', <any>this._onScrollBounced);
		});
	}

	private _updateViewPort(redraw = true, shift = 0) {
		this._zone.runOutsideAngular(() => {

			if (!this._chart || !this._chart.options.data[0].dataPoints.length)
				return;

			let data = this._chart.options.data[0].dataPoints,
				offset = this._scrollOffset + shift,
				viewable = this._calculateViewableBars(),
				minOffset = 0,
				maxOffset = data.length - 1 - viewable,
				min, max;

			if (offset > maxOffset)
				offset = maxOffset;
			else if (offset < minOffset)
				offset = minOffset;

			this._scrollOffset = offset;

			min = data[data.length - offset - viewable];
			max = data[data.length - offset - 1];

			if (min && max) {
				this._chart.options.axisX.viewportMinimum = min.x;
				this._chart.options.axisX.viewportMaximum = max.x
			}

			if (redraw)
				this._chart.render();
		});
	}

	private async _fetch(count: number, offset: number) {
		this.loading$.next(true);

		let {candles, indicators, orders} = await this._instrumentsService.fetch(this.model, count, offset);

		this._updateBars(candles);
		this._updateIndicators(indicators);
		// this._updateOrders(orders);

		this._chart.render();
		this.loading$.next(false);
	}

	private _updateOrders(orders: Array<any>) {
		this._zone.runOutsideAngular(() => {
			this._chart.get('orders').setData(orders.map(order => [order.openTime, order.bid, null]));
		});
	}

	private _updateBars(data: any[] = []) {
		this._zone.runOutsideAngular(() => {
			let {candles, volume} = ChartComponent._prepareData(data),
				last = candles[candles.length - 1];

			this._chart.options.data[0].dataPoints = candles;

			this._updateViewPort(false);

			// this._chart.series[0].setData(candles, false, false);
			// this._chart.series[1].setData(volume, false, false);

			// Re-update viewport needed for initial batch of bars
			// this._updateViewPort();

			// PlotLine cannot be delayed, so to prevent instant re-render from updateViewPort,
			// Do this after
			// this._setCurrentPricePlot(last);
		});
	}

	private _setCurrentPricePlot(bar) {
		if (!bar)
			return;

		this._zone.runOutsideAngular(() => {
			this._chart.yAxis[0].removePlotLine('current-price');

			this._chart.yAxis[0].addPlotLine({
				value: bar[4],
				color: '#646467',
				width: 1,
				id: 'current-price',
				label: {
					text: `<div class='chart-current-price-label' style='background:white;'>${bar[4]}</div>`,
					align: 'right',
					x: 5,
					y: 2,
					style: {
						color: '#000'
					},
					useHTML: true,
					textAlign: 'left'
				}
			});
		});
	}

	private _updateIndicators(indicators) {
		if (!indicators.length)
			return;

		this._zone.runOutsideAngular(() => {
			
			indicators.forEach(indicator => {
				for (let drawBufferName in indicator.data) {
					if (indicator.data.hasOwnProperty(drawBufferName)) {
						let drawBuffer = indicator.data[drawBufferName];

						let unique = indicator.id + '_' + drawBuffer.id;


						// New series
						let series = this._chart.get(unique);

						// Update
						if (series) {
							console.log('SERIES!!!!', series);
						}

						// Create
						else {
							switch (drawBuffer.type) {
								case 'line':
									let newSeries = {
										type: drawBuffer.type,
										color: drawBuffer.style.color,
										name: indicator.id,
										dataPoints: drawBuffer.data.map(point => ({
											x: point[0],
											y: point[1]
										}))
									};

									this._chart.options.data.push(newSeries);
									break;
								case 'arrow':
									alert('cannot yet draw arrow');
									break;
							}
						}
					}
				}
			});
		});
	}

	/*
	 Stop highchart from moving the Y axis so much
	 TODO: improve
	 */
	private _getSurroundingPriceRange(padding = 200, viewable) {
		let data = this._chart.series[0].yData,
			i = data.length - this._scrollOffset - viewable - padding,
			len = (data.length - this._scrollOffset) + padding,
			price, low, high;

		if (i < 0)
			i = 0;

		if (len > data.length)
			len = data.length;

		for (; i < len; ++i) {
			price = data[i][0];
			if (!high || price > high) {
				high = price;
			} else if (!low || price < low) {
				low = price;
			}
		}

		return {low, high};
	}

	private _calculateViewableBars(checkParent = true) {
		let el = this._elementRef.nativeElement,
			barW = 3 * this.model.options.zoom;

		if (checkParent)
			el = el.parentNode;

		return Math.floor(el.clientWidth / barW);
	}

	private _onScroll(event: MouseWheelEvent): boolean {
		event.stopPropagation();
		event.preventDefault();

		let shift = Math.ceil(this._calculateViewableBars() / this._scrollSpeedStep);

		if (shift < this._scrollSpeedMin)
			shift = this._scrollSpeedMin;
		else if (shift > this._scrollSpeedMax)
			shift = this._scrollSpeedMax;

		this._updateViewPort(true, event.wheelDelta > 0 ? -shift : shift);

		return false;
	}

	static _prepareData(data: any) {
		let i = 0,
			length = data.length,
			volume = new Array(length),
			candles = new Array(length),
			candle;

		for (; i < length; i += 1) {
			candle = data[i];
			volume[i] = [
				candle[0], // Date
				candle.pop() // Volume
			];
			// TODO - Now only Bid prices - Make Ask / Bid switch in UI
			candles[i] = {x: new Date(candle[0]), y: [candle[1], candle[3], candle[5], candle[7]]};
		}

		return {
			candles: candles,
			volume: volume
		};
	}

	private _destroyChart() {

		// Unbind scroll
		this._chart.container.removeEventListener('mousewheel', <any>this._onScrollBounced);

		// Destroy chart
		this._chart.destroy();
		this._chart = null;
	}

	public ngOnDestroy() {
		console.log('_destroyChart _destroyChart _destroyChart _destroyChart');
		this._destroyChart();
	}
}