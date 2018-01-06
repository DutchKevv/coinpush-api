import { throttle } from 'lodash';
import {
	Component, OnDestroy, ElementRef, Input, ViewChild,
	OnInit, AfterViewInit, NgZone, Output, SimpleChanges, OnChanges, ChangeDetectionStrategy, ViewEncapsulation
} from '@angular/core';
import { CacheService } from '../../services/cache.service';
import { ConstantsService } from '../../services/constants.service';
import { SymbolModel } from "../../models/symbol.model";

declare let Highcharts: any;

@Component({
	selector: 'app-chart-box',
	templateUrl: './chart-box.component.html',
	styleUrls: [
		'./chart-box.component.scss'
	],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})


export class ChartBoxComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {

	@Input() symbolModel: SymbolModel;

	@Input() showBox: Boolean = false;
	@Input() quickBuy: Boolean = false;

	@ViewChild('chart') private chartRef: ElementRef;
	@ViewChild('loading') private loadingRef: ElementRef;

	public graphType = 'line';
	public zoom = 1;
	public timeFrame = 'H1';

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
	private _onScrollBounced: Function = null;
	private _mouseActive = true;
	private _changeSubscription;
	private _priceSubscription;
	private _orderSubscription;

	public static readonly DEFAULT_CHUNK_LENGTH = 300;
	public static readonly VIEW_STATE_WINDOWED = 1;
	public static readonly VIEW_STATE_STRETCHED = 2;
	public static readonly VIEW_STATE_MINIMIZED = 3;

	private _prepareData(data: any) {
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

		if (candles.length) {
			if (this.symbolModel.options.bid) {
				candles[candles.length - 1][1] = this.symbolModel.options.bid;
			} else {
				console.log('no current price for symbol!', this.symbolModel.options.name);
			}
		}

		return { candles, volume };
	}

	constructor(
		public constantsService: ConstantsService,
		private _zone: NgZone,
		private _cacheService: CacheService,
		private _elementRef: ElementRef) {
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.symbolModel && changes.symbolModel.currentValue) {

			this.init();

			this.symbolModel = changes.symbolModel.currentValue;
		}
	}

	ngOnInit() {
		this._changeSubscription = this._cacheService.changed$.subscribe(symbols => {
			if (this.symbolModel && symbols.includes(this.symbolModel.options.name)) {
				this._onPriceChange(false);
				this._updateCurrentPricePlot();
			}
		});
	}

	ngAfterViewInit() {
		this._onScrollBounced = throttle(this._onScroll.bind(this), 33);
		this.chartRef.nativeElement.addEventListener('mousewheel', <any>this._onScrollBounced);
	}

	init() {
		this.toggleLoading(true);

		if (!this.symbolModel)
			return;

		this._fetchCandles();

		// this._chart.series[0].name = this.symbolModel.options.displayName;
	}

	public setZoom(amount) {
		this.zoom += amount;
		this._updateViewPort(0, true);
	}

	public changeGraphType(type) {
		if (!this._chart)
			return;

		if (type === 'line') {
			this._chart.series[0].setData(this._data.candles.map(candle => [candle[0], candle[1]]), false);
		} else if (this.graphType === 'line') {
			this._chart.series[0].setData(this._data.candles, false);
		}

		this.graphType = type;

		this._chart.series[0].update({ type }, true, false);
	}

	public toggleTimeFrame(timeFrame: string) {
		this._destroyChart();
		this.timeFrame = timeFrame;
		this._createChart();
		this.init();
	}

	public addIndicator(name: string) {

	}

	public toggleLoading(state?: boolean) {
		// this.loadingRef.nativeElement.classList.toggle('active', !!state);
	}

	private _createChart() {

		this._zone.runOutsideAngular(() => {
			var self = this;

			// create the chart
			this._chart = Highcharts.stockChart(this.chartRef.nativeElement, {

				chart: {
					pinchType: 'x',
					marginLeft: 4,
					marginTop: 1,
					marginBottom: 25
				},

				indicators: [
					{
						id: 'main-series',
						type: 'sma',
						params: {
							period: 5,
						},
						tooltip: {
							pointFormat: '<span style="color: {point.color}; ">pointFormat SMA: </span> {point.y}<br>'
						},
					},
					// {
					// 	id: 'main-series',
					// 	type: 'ema',
					// 	params: {
					// 		period: 5,
					// 		index: 0
					// 	},
					// 	styles: {
					// 		strokeWidth: 2,
					// 		stroke: 'green',
					// 		dashstyle: 'solid'
					// 	}
					// },
					// {
					// 	id: 'main-series',
					// 	type: 'atr',
					// 	params: {
					// 		period: 14,
					// 	},
					// 	styles: {
					// 		strokeWidth: 2,
					// 		stroke: 'orange',
					// 		dashstyle: 'solid'
					// 	},
					// 	yAxis: {
					// 		lineWidth: 2,
					// 		title: {
					// 			text: 'My ATR title'
					// 		}
					// 	}
					// },
					// {
					// 	id: 'main-series',
					// 	type: 'rsi',
					// 	params: {
					// 		period: 14,
					// 		overbought: 70,
					// 		oversold: 30
					// 	},
					// 	styles: {
					// 		strokeWidth: 2,
					// 		stroke: 'black',
					// 		dashstyle: 'solid'
					// 	},
					// 	yAxis: {
					// 		lineWidth: 2,
					// 		title: {
					// 			text: 'My RSI title'
					// 		}
					// 	}
					// }
				],
				tooltip: {
					enabledIndicators: true
				},

				xAxis: [
					{},
					{
						lineWidth: 0,
						gridLineWidth: 1,
						gridLineDashStyle: 'dot',
						gridZIndex: -1,
						minPadding: 0,
						maxPadding: 0,

						// Fill empty time gaps (when there are no bars)
						ordinal: true
					}],

				yAxis: [{
					opposite: true,
					labels: {
						align: 'left',
						x: 6,
						y: 8,
						formatter: function () {
							return self._priceToFixed(this.value);
						}
					},
					title: {
						text: null
					},
					// offset: 10,
					height: '75%',
					lineWidth: 1,
					resize: {
						enabled: true
					},
					plotLines: []
				}, {
					opposite: true,
					labels: {
						align: 'left',
						x: 6,
						y: 8
					},
					title: {
						text: null
					},
					top: '80%',
					height: '20%',
					// offset: 10,
					lineWidth: 1
				}],

				series: [
					{
						id: 'main-series',
						type: this.graphType,
						name: this.symbolModel.options.displayName,
						data: this._data.candles
					},
					{
						type: 'column',
						name: 'Volume',
						data: this._data.volume,
						yAxis: 1
					},
				]
			}, false);
		});
	}

	private _updateViewPort(shift = 0, render: boolean = false) {
		return this._zone.runOutsideAngular(() => {

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
				lastBar = data[data.length - 1 - offset] || data[data.length - 1];

			if (!firstBar || !lastBar)
				return;

			if (this._chart)
				this._chart.xAxis[0].setExtremes(firstBar[0], lastBar[0], render, false);
		});
	}

	private _fetchCandles() {

		this._zone.runOutsideAngular(async () => {
			try {
				let data: any = this._prepareData(await this._cacheService.read({
					symbol: this.symbolModel.options.name,
					timeFrame: this.timeFrame,
					count: ChartBoxComponent.DEFAULT_CHUNK_LENGTH,
					offset: this._offset
				}));

				if (!this._chart)
					this._createChart();

				this.toggleLoading(false);

				this._data.candles = data.candles;
				this._data.volume = data.volume;

				this._chart.series[0].setData(this._data.candles, false);
				this._chart.series[1].setData(this._data.volume, false);

				this._updateCurrentPricePlot();
				this._updateViewPort(0, true);
			} catch (error) {
				console.log('error error error', error);
			}
		});
	}

	private _updateCurrentPricePlot(render: boolean = false) {
		return this._zone.runOutsideAngular(() => {

			const price = this._priceToFixed(this.symbolModel.options.bid);

			const options = {
				id: 'cPrice',
				color: '#67C8FF',
				// color: '#FF0000',
				width: 1,
				dashStyle: 'dot',
				value: price,
				label: {
					text: '<div class="plot-label">' + price + '</div>',
					useHTML: true,
					align: 'right',
					x: (6 * price.toString().length),
					y: 4
				}
			};

			this._chart.yAxis[0].removePlotLine('cPrice', false, false);
			this._chart.yAxis[0].addPlotLine(options, render, false);
		});
	}

	private _calculateViewableBars(checkParent = true) {
		let el = this._elementRef.nativeElement,
			barW = 6 * this.zoom;

		return Math.floor(el.clientWidth / barW);
	}

	private _onPriceChange(render: boolean = false) {
		if (this._chart && this._chart.series[0].data.length)
			this._chart.series[0].data[this._chart.series[0].data.length - 1].update(this.symbolModel.options.bid, true, false);
	}

	private _onScroll(event: MouseWheelEvent): boolean {
		event.stopPropagation();
		event.preventDefault();

		let shift = Math.ceil(this._calculateViewableBars() / this._scrollSpeedStep);

		if (shift < this._scrollSpeedMin)
			shift = this._scrollSpeedMin;
		else if (shift > this._scrollSpeedMax)
			shift = this._scrollSpeedMax;

		this._updateViewPort(event.wheelDelta > 0 ? -shift : shift, true);

		return false;
	}

	private _priceToFixed(number: Number): string {
		if (!number)
			return '';

		if (this.symbolModel.options.precision > 0)
			return number.toFixed(this.symbolModel.options.precision || 4);

		let n = Math.min(Math.max(number.toString().length, 2), 6);
		return number.toFixed(Math.max(number.toString().length, 4));
	}

	private _clearData(render: boolean = false) {
		if (!this._chart || !this._chart.series[0] || !this._chart.series[1])
			return;

		this._chart.yAxis[0].removePlotLine('cPrice', false, false);

		this._chart.series[0].setData([], false, false);
		this._chart.series[1].setData([], render, false);
	}

	private _destroyChart() {
		if (this._chart)
			this._chart.destroy();

		this._data = {
			candles: [],
			volume: [],
			indicators: [],
			orders: []
		};

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
		this.chartRef.nativeElement.removeEventListener('mousewheel', <any>this._onScrollBounced);

		this._destroy();
	}
}