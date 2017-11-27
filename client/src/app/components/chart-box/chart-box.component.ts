import { forEach, random, throttle } from 'lodash';
import {
	Component, OnDestroy, ElementRef, Input, ViewChild,
	OnInit, AfterViewInit, ViewEncapsulation, NgZone, Output, SimpleChanges, OnChanges, ChangeDetectionStrategy
} from '@angular/core';

import { DialogComponent } from '../dialog/dialog.component';
import { InstrumentsService } from '../../services/instruments.service';
import { DialogAnchorDirective } from '../../directives/dialoganchor.directive';
import { InstrumentModel } from '../../models/instrument.model';
import * as interact from 'interactjs';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CacheService } from '../../services/cache.service';
import * as moment from 'moment';
import { OrderService } from '../../services/order.service';
import { ConstantsService } from '../../services/constants.service';
import { BaseModel } from '../../models/base.model';
import { SymbolModel } from "../../models/symbol.model";

const Highcharts = require('highcharts');
const Highstock = require('highcharts/highstock');
require('highcharts/modules/exporting');
require('../../../assets/vendor/js/highcharts/indicators/indicators.js');
require('../../../assets/vendor/js/highcharts/indicators/macd.js');
require('../../../assets/vendor/js/highcharts/indicators/ema');
// require('../../../assets/vendor/js/highcharts/indicators/sma');
// import Highstock from 'highcharts/highstock';

declare let $: any;

import { HighchartsDefaultTheme } from '../../style/highcharts/highstock.theme.default';
import '../../style/highcharts/highstock.theme.dark';

@Component({
	selector: 'chart-box',
	templateUrl: './chart-box.component.html',
	styleUrls: [
		'./chart-box.component.scss'
	],
	// encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush,
	entryComponents: [DialogComponent]
})


export class ChartBoxComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {

	@Input() instrumentModel: InstrumentModel;
	@Input() symbolModel: SymbolModel;

	@Input() showBox: Boolean = false;
	@Input() quickBuy: Boolean = false;
	@Output() loading$ = new BehaviorSubject(true);

	@ViewChild(DialogAnchorDirective) private _dialogAnchor: DialogAnchorDirective;
	@ViewChild('chart') private chartRef: ElementRef;

	@Output() public viewState$: BehaviorSubject<any> = new BehaviorSubject('windowed');

	public viewState = 'windowed';

	$el: any;

	private _data = {
		candles: [],
		volume: [],
		indicators: [],
		orders: []
	};

	private minimized = false;

	private _offset = 0;
	private _scrollOffset = -1;
	private _scrollSpeedStep = 6;
	private _scrollSpeedMin = 1;
	private _scrollSpeedMax = 20;

	private _chart: any;
	private _chartVolume: any;
	private _onScrollBounced: Function = null;
	private _onScrollTooltipTimeout = null;
	private _oCanvasMouseMoveFunc = null;
	private _mouseActive = true;
	private _changeSubscription;
	private _priceSubscription;
	private _orderSubscription;

	public static readonly DEFAULT_CHUNK_LENGTH = 100;
	public static readonly VIEW_STATE_WINDOWED = 1;
	public static readonly VIEW_STATE_STRETCHED = 2;
	public static readonly VIEW_STATE_MINIMIZED = 3;

	public static _prepareData(data: any) {
		let i = 0,
			rowLength = 10,
			length = data.length,
			volume = new Array(length / rowLength),
			candles = new Array(length / rowLength);

		for (; i < length; i += rowLength) {
			candles[i / rowLength] = [
				data[i],
				data[i + 1], // open
				data[i + 3], // high
				data[i + 5], // low
				data[i + 7] // close
			];

			volume[i / rowLength] = [
				data[i],
				data[i + 9] // the volume
			];
		}

		return {
			candles: candles,
			volume: volume
		};
	}

	constructor(public instrumentsService: InstrumentsService,
		public constantsService: ConstantsService,
		private _zone: NgZone,
		private _cacheService: CacheService,
		private _elementRef: ElementRef,
		private _orderService: OrderService) {
	}

	ngOnChanges(changes: SimpleChanges) {
		console.log(changes);

		if (changes.symbolModel) {
			this.instrumentModel = null;
			this.symbolModel = changes.symbolModel.currentValue;

			setTimeout(() => this.init(), 0);
		}
	}

	ngOnInit() {
	}

	ngAfterViewInit() {
		// this.init();
	}

	init() {
		if (!this.symbolModel && !this.instrumentModel)
			return;

		this._destroy();

		console.log('box INIT!!');

		if (this.instrumentModel) {
			if (!this.symbolModel)
				this.symbolModel = this._cacheService.getBySymbol(this.instrumentModel.options.symbol);

		} else {
			this.instrumentModel = new InstrumentModel({
				symbol: this.symbolModel.options.name
			});
		}

		this._onScrollBounced = throttle(this._onScroll.bind(this), 33);

		this._fetchCandles();

		// Listen for price change
		this._priceSubscription = this.symbolModel.options$.subscribe((options) => this._onPriceChange(options));

		// Listen for orders change
		this._orderSubscription = this._orderService.orders$.subscribe((options) => this._updateOrders(options));

		if (this.instrumentModel.options.id) {
			this._fetchIndicators(ChartBoxComponent.DEFAULT_CHUNK_LENGTH, this._offset);
		} else {
			let subscription = this.instrumentModel.changed$.subscribe(() => {
				if (this.instrumentModel.options.id) {
					subscription.unsubscribe();
					this._fetchIndicators(ChartBoxComponent.DEFAULT_CHUNK_LENGTH, this._offset);
				}
			});
		}

		this._changeSubscription = this.instrumentModel.changed$.subscribe(changes => {
			let dirty = false;

			Object.keys(changes).forEach(change => {
				switch (change) {
					case 'zoom':

						if (this._chart)
							this._updateViewPort();
						dirty = true;
						break;
					case 'graphType':
						this.changeGraphType();
						dirty = true;
						break;
					case 'timeFrame':
						this.toggleTimeFrame();
						break;
					case 'indicator':
						this._updateIndicators();
						dirty = true;
						break;
					case 'focus':
						if (changes.focus === true) {
							this.toggleViewState(true);
						}
						break;
					case 'orders':
						this._updateOrders(changes.orders);
						dirty = true;
						break;
				}
			});

			if (dirty)
				this.render();
		});
	}

	placeOrder(event, side: number) {
		event.preventDefault();

		if (event.path[0].nodeName.toLowerCase() === 'input')
			return;

		const amount = parseFloat(event.currentTarget.querySelector('input').value);
		this._orderService.create({ symbol: this.instrumentModel.options.symbol, side, amount });
	}

	public changeGraphType() {
		if (!this._chart)
			return;

		this._chart.options.data[0].type = this.instrumentModel.options.graphType;
	}

	public reflow() {
		if (!this._chart)
			return;

		this._zone.runOutsideAngular(() => {
			this._chart.options.height = this.chartRef.nativeElement.clientHeight;
			this._chart.options.width = this.chartRef.nativeElement.clientWidth;
			this._updateViewPort();
		});
	}

	public render() {
		if (!this._chart)
			return;

		// this._chart.render();
		// this._chartVolume.render();
	}

	public toggleTimeFrame() {
		this.loading$.next(true);
		this._fetchCandles();
		// this._fetchIndicators(ChartBoxComponent.DEFAULT_CHUNK_LENGTH, this._offset);
	}

	private _createChart() {
		this._zone.runOutsideAngular(() => {

			this._destroyChart();


			// create the chart
			this._chart = Highstock.chart(this.chartRef.nativeElement, {

				title: {
					text: ''
					// text: this.symbolModel.get('displayName')
				},

				subtitle: {
					text: '',
					style: {
						display: 'none'
					}
				},

				legend: {
					enabled: false
				},

				xAxis: [{
					labels: {
						step: 1, // Disable label rotating when there is not enough space
						staggerLines: false,
						format: '{value:%d-%m %H:%M}',
						y: 14
					},
					minorGridLineWidth: 0,
					lineColor: '#d2d2d5',
					lineWidth: 1,
					gridLineWidth: 1,
					gridLineDashStyle: 'dot',
					gridZIndex: -1,
					tickPixelInterval: 80,
					minorTickLength: 0,

					// Fill empty time gaps (when there are no bars)
					ordinal: true
				},
				{
					labels: {
						step: 1, // Disable label rotating when there is not enough space
						staggerLines: false,
					},
					lineWidth: 0,
					gridLineWidth: 1,
					gridLineDashStyle: 'dot',
					gridZIndex: -1,

					// Fill empty time gaps (when there are no bars)
					ordinal: true
				}],

				yAxis: [{
					opposite: true,
					labels: {
						align: 'left'
						// x: 0
					},
					title: {
						text: null
					},
					height: '60%',
					lineWidth: 1,
					resize: {
						enabled: true
					}
				}, {
					opposite: true,
					labels: {
						align: 'left',
						// x: 0
					},
					title: {
						text: null
					},
					top: '65%',
					height: '35%',
					offset: 0,
					lineWidth: 1
				}],

				tooltip: {
					split: true
				},

				series: [
					{
						id: 'main-series',
						type: 'candlestick',
						name: this.symbolModel.options.displayName,
						// data: ohlc,
						data: this._data.candles,
						// dataGrouping: {
						// 	enabled: false
						// }
					},
					{
						type: 'column',
						name: 'Volume',
						data: this._data.volume,
						yAxis: 1,
						// dataGrouping: {
						// 	units: groupingUnits
						// }
					},
				]
			});

			// {
			// 	type: 'sma',
			// 	linkedTo: 'main-series',
			// 	params: {
			// 	  period: 14
			// 	}
			//   }, {
			// 	type: 'sma',
			// 	linkedTo: 'main-series',
			// 	params: {
			// 	  period: 28
			// 	}
			//   }, {
			// 	type: 'sma',
			// 	linkedTo: 'main-series',
			// 	params: {
			// 	  period: 7
			// 	}
			//   }

			this.chartRef.nativeElement.addEventListener('mousewheel', <any>this._onScrollBounced);
			this._updateViewPort();
			// this._updateIndicators();
			this._updateOrders(this._orderService.orders$.getValue());
		});
	}

	private _updateViewPort(shift = 0) {
		this._zone.runOutsideAngular(() => {
			if (!this._chart || !this._data.candles.length)
				return;

			let data = this._data.candles,
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

			let firstBar = (data[data.length - viewable - offset] || data[0]),
				lastBar = data[data.length - 1 - offset];

			if (firstBar && lastBar)
				this._chart.xAxis[0].setExtremes(firstBar[0], lastBar[0], false, false);
		});
	}

	private _fetchCandles() {
		this._zone.runOutsideAngular(async () => {
			try {
				let data: any = ChartBoxComponent._prepareData(await this._cacheService.read({
					symbol: this.instrumentModel.options.symbol,
					// timeFrame: 'D',
					timeFrame: this.instrumentModel.options.timeFrame,
					until: this.instrumentModel.options.type === 'backtest' && this.instrumentModel.options.status.progress < 1 ? this.instrumentModel.options.from : this.instrumentModel.options.until,
					count: ChartBoxComponent.DEFAULT_CHUNK_LENGTH,
					offset: this._offset
				}));

				this._data.candles = data.candles;
				this._data.volume = data.volume;

				if (!this._chart)
					this._createChart();

				this._updateCurrentPricePlot();
				// this._updateViewPort();
				// this.render();
			} catch (error) {
				this.loading$.next(false);
				console.log('error error error', error);
			}
		});
	}

	private _updateCurrentPricePlot(): void {
		this._zone.runOutsideAngular(() => {
			let lastCandle = this._data.candles[this._data.candles.length - 1];

			if (!lastCandle)
				return;

			this._chart.yAxis[0].removePlotLine('cPrice', false, false);

			this._chart.yAxis[0].addPlotLine({
				id: 'cPrice',
				color: '#FF0000',
				width: 1,
				value: lastCandle[1],
				label: {
					text: lastCandle[1].toString(),
					align: 'right',
					x: 40,
					y: 2,
					style: {
						color: 'white'
					}
				}
			}, false, false);
		});
	}

	private _fetchIndicators(count: number, offset: number) {
		this._zone.runOutsideAngular(async () => {
			try {
				let data;

				if (this.instrumentModel.options.type === 'backtest' && this.instrumentModel.options.status.progress < 1)
					data = await this.instrumentsService.fetch(this.instrumentModel, count, offset, undefined, this.instrumentModel.options.from);
				else
					data = await this.instrumentsService.fetch(this.instrumentModel, count, offset);


				if (!data.indicators.length)
					return;

				this._data.indicators = data.indicators;

				this._updateIndicators();

				if (this._chart)
					this.render();

			} catch (error) {
				console.error(error);
			}
		});
	}

	private _updateIndicators() {
		if (!this._chart)
			return;
		//
		this._zone.runOutsideAngular(() => {

			this.instrumentModel.options.indicators.forEach(indicator => {
				indicator.buffers.forEach(drawBuffer => {
					// New series
					let series = null; // this._chart.get(unique);

					// Update
					if (series) {
						console.log('SERIES!!!!', series);
					}

					// Create
					else {
						switch (drawBuffer.type) {
							case 'line':
								this._chart.options.data.push({
									type: drawBuffer.type,
									lineThickness: 0.5,
									bevelEnabled: false,
									connectNullData: false,
									color: drawBuffer.style.color,
									valueFormatString: ' ',
									name: indicator.id,
									axisYType: 'secondary',
									markerType: 'circle',
									markerSize: 0,
									dataPoints: drawBuffer.data.map((point, i) => ({
										// label: moment(point[0]).format('DD-MM hh:mm'),
										// x: i,
										y: point[1]
									}))
								});
								break;
							case 'arrow':
								alert('cannot yet draw arrow');
								break;
						}
					}
				});
			});
		});
	}

	private _updateOrders(orders: any[] = this.instrumentModel.options.orders) {
		if (!this._chart)
			return;

		this._zone.runOutsideAngular(() => {

			orders.filter(order => !order.options.closed && order.options.symbol === this.instrumentModel.options.symbol).forEach((order: any) => {

				// if (order.closeTime < this._data.candles[0])
				// 	return;

				// draw openings price
				this._chart.yAxis[0].addPlotLine({
					id: 'order_' + order.options._id,
					color: '#00FF00',
					width: 1,
					value: order.options.openBid,
					label: {
						text: order.options.openBid,
						align: 'right',
						x: 40,
						y: 2,
						style: {
							color: 'white'
						}
					}
				});

				// this._chart.options.data[1].dataPoints.push(...[
				// 		{
				// 			// label: moment(order.openTime).format('DD-MM hh:mm'),
				// 			// x: this._chart.options.data[0].dataPoints.find(point => point.time === order.openTime).x,
				// 			y: null,
				// 			lineColor: order.side === 'sell' ? '#ff00e1' : '#007fff',
				// 			color: order.profit > 0 ? '#01ff00' : 'red',
				// 			id: order.id,
				// 			profit: order.profit
				// 			// lineColor: 'red'
				// 		},
				// 		{
				// 			// label: moment(order.openTime).format('DD-MM hh:mm'),
				// 			x: this._chart.options.data[0].dataPoints.findIndex(point => point.time === order.openTime),
				// 			y: order.openBid,
				// 			lineColor: order.side === 'sell' ? '#ff00e1' : '#007fff',
				// 			color: order.profit > 0 ? '#01ff00' : 'red',
				// 			id: order.id,
				// 			profit: order.profit
				// 		},
				// 		{
				// 			// label: moment(order.closeTime).format('DD-MM hh:mm'),
				// 			x: this._chart.options.data[0].dataPoints.findIndex(point => point.time === order.closeTime),
				// 			y: order.closeBid,
				// 			id: order.id,
				// 			profit: order.profit,
				// 			// lineColor: order.type === 'sell' ? '#ff00e1' : '#007fff',
				// 			color: order.profit > 0 ? '#01ff00' : 'red'
				// 			// lineColor: 'red'
				// 		}
				// 	]
				// );
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

		return { low, high };
	}

	private _calculateViewableBars(checkParent = true) {
		let el = this._elementRef.nativeElement,
			barW = 3 * this.instrumentModel.options.zoom;

		return Math.floor(el.clientWidth / barW);
	}

	public getStyles(): any {
		return {
			x: parseInt(this._elementRef.nativeElement.getAttribute('data-x'), 10) || 0,
			y: parseInt(this._elementRef.nativeElement.getAttribute('data-y'), 10) || 0,
			z: parseInt(this._elementRef.nativeElement.style.zIndex, 10) || 1,
			w: this._elementRef.nativeElement.clientWidth,
			h: this._elementRef.nativeElement.clientHeight
		};
	}

	public setStyles(styles?: { x?: any, y?: any, z?: any, w?: any, h?: any }, redraw = false): void {
		let diffs = BaseModel.getObjectDiff(styles, this.getStyles()),
			obj: any = {};

		if (!diffs.length)
			return;

		// Filter out changes
		diffs.forEach(key => {
			switch (key) {
				case 'x':
				case 'y':
					this._elementRef.nativeElement.setAttribute('data-x', styles.x);
					this._elementRef.nativeElement.setAttribute('data-y', styles.y);
					obj.transform = `translate(${styles.x}px, ${styles.y}px)`;
					break;
				case 'z':
					obj.zIndex = styles[key];
					break;
				case 'w':
				case 'h':
					obj.width = parseInt(styles.w, 10) + 'px';
					obj.height = parseInt(styles.h, 10) + 'px';

					this.toggleViewState('windowed');

					if (redraw) {
						this._elementRef.nativeElement.classList.add('black');
						setTimeout(() => {
							this._updateViewPort();
							this.render();
							this._elementRef.nativeElement.classList.remove('black');
						}, 0);
					}
					break;
			}
		});

		// Apply multiple styles in 1 go
		// TODO: Check if really is faster then setting props 1 by 1
		Object.assign(this._elementRef.nativeElement.style, obj);

		this.storeStyles();
	}

	public storeStyles() {
		if (this.instrumentModel.options.id)
			localStorage.setItem(`instrument-${this.instrumentModel.options.id}-p`, JSON.stringify(this.getStyles()));
	}

	public toggleViewState(viewState: string | boolean, render = false) {
		let elClassList = this._elementRef.nativeElement.classList;

		if (typeof viewState === 'string') {

			if (this.viewState !== viewState) {

				elClassList.remove(this.viewState);
				elClassList.add(viewState);

				this.viewState = viewState;

				this.viewState$.next(this.viewState);
				this.reflow();

				if (render) {
					this.render();
				}
			}
		} else {
			this.viewState = viewState ? 'windowed' : 'minimized';
			elClassList.toggle('minimized', !viewState);
		}

		// this._ref.markForCheck();
	}

	private _onPriceChange(options: any) {
		if (!this._data.candles.length)
			return;

		this._updateCurrentPricePlot();
		this.render();
	}

	private _onScroll(event: MouseWheelEvent): boolean {
		event.stopPropagation();
		event.preventDefault();

		let shift = Math.ceil(this._calculateViewableBars() / this._scrollSpeedStep);

		if (shift < this._scrollSpeedMin)
			shift = this._scrollSpeedMin;
		else if (shift > this._scrollSpeedMax)
			shift = this._scrollSpeedMax;

		clearTimeout(this._onScrollTooltipTimeout);

		this._mouseActive = false;
		// this._chart.options.toolTip.enabled = false;
		this._onScrollTooltipTimeout = setTimeout(() => {
			// this._chart.options.toolTip.enabled = true;
			this._mouseActive = true;
			// this.render();
		}, 500);
		// this._chart.toolTip.hide();

		this._updateViewPort(event.wheelDelta > 0 ? -shift : shift);

		// this.render();

		return false;
	}

	private _prepareData(data: any) {
		let length = data.length,
			volume = new Array(length),
			i = 0;

		for (; i < length; i += 1)
			volume[i] = [
				data[i][0], // Date
				data[i].pop() // Volume
			];

		return {
			candles: data,
			volume: volume
		};
	}

	private _destroyChart() {
		this.chartRef.nativeElement.removeEventListener('mousewheel', <any>this._onScrollBounced);

		if (this._chart)
			this._chart.destroy();

		this._chart = null;
	}

	private _destroy() {
		if (this._changeSubscription)
			this._changeSubscription.unsubscribe();

		if (this._priceSubscription)
			this._priceSubscription.unsubscribe();

		if (this._orderSubscription)
			this._orderSubscription.unsubscribe();

		this._destroyChart();

		this._data = {
			candles: [],
			volume: [],
			indicators: [],
			orders: []
		};
	}

	async ngOnDestroy() {
		this._destroy();
	}
}