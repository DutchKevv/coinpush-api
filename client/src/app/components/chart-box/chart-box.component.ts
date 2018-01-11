import { throttle } from 'lodash';
import {
	Component, OnDestroy, ElementRef, Input, ViewChild,
	OnInit, AfterViewInit, NgZone, Output, SimpleChanges, OnChanges, ChangeDetectionStrategy, ViewEncapsulation
} from '@angular/core';
import { CacheService } from '../../services/cache.service';
import { ConstantsService } from '../../services/constants.service';
import { SymbolModel } from "../../models/symbol.model";
import { EventService } from '../../services/event.service';
import { CUSTOM_EVENT_TYPE_ALARM, CUSTOM_EVENT_TYPE_PRICE, CUSTOM_EVENT_TYPE_ALARM_NEW } from '../../../../../shared/constants/constants';

declare let Highcharts: any;

const SERIES_MAIN_NAME = 'main';
const SERIES_VOLUME_NAME = 'volume';
const DEFAULT_GRAPHTYPE = 'line';

@Component({
	selector: 'app-chart-box',
	templateUrl: './chart-box.component.html',
	styleUrls: [
		'./chart-box.component.scss'
	],
	// encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})


export class ChartBoxComponent implements OnDestroy, AfterViewInit, OnChanges {
	static PLOTLINE_TYPE_DEFAULT = 0;
	static PLOTLINE_TYPE_NEW_ALARM = 1;
	static PLOTLINE_TYPE_ALARM = 2;
	static PLOTLINE_TYPE_PRICE = 100;

	@Input() symbolModel: SymbolModel;

	@Input() showBox: Boolean = false;
	@Input() quickBuy: Boolean = false;

	@ViewChild('chart') private chartRef: ElementRef;
	@ViewChild('loading') private loadingRef: ElementRef;

	public graphType = DEFAULT_GRAPHTYPE;
	public zoom = 1;
	public timeFrame = 'H1';

	$el: any;

	private _data = {
		candles: [],
		volume: [],
		indicators: []
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
	private _labelEl: any;

	public static readonly DEFAULT_CHUNK_LENGTH = 500;

	constructor(
		public constantsService: ConstantsService,
		private _zone: NgZone,
		private _cacheService: CacheService,
		private _eventService: EventService,
		private _elementRef: ElementRef) {
		this._buildLabelEl();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (this._changeSubscription && this._changeSubscription.unsubscribe)
			this._changeSubscription.unsubscribe();

		if (changes.symbolModel && changes.symbolModel.currentValue) {

			this._changeSubscription = this._cacheService.changed$.subscribe(symbols => {
				if (this.symbolModel && symbols.includes(this.symbolModel.options.name))
					this._onPriceChange(true);
			});

			this.init();
		} else {
			this._destroyChart();
		}
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
		this._createChart();
		this._onPriceChange(false); // aligns last pricess
	}

	public updatePlotLine(id: string, value: number, type: number, render: boolean = false) {
		if (!this._chart)
			return;

		return this._zone.runOutsideAngular(() => {
			this.removePlotLine(id);

			if (!value)
				return;

			const labelEl = this._labelEl;

			const options = {
				id: id,
				color: 'yellow',
				// color: '#FF0000',
				width: 1,
				dashStyle: 'solid',
				value: value,
				textAlign: 'left',
				label: {
					text: '',
					// text: '<div class="plot-label plot-label-alarm"><span style="background: red !important;">' + value + '</span></div>',
					useHTML: true,
					align: 'right',
					textAlign: 'left',
					y: 4,
					x: 2
				}
			};

			labelEl.children[1].innerText = this._cacheService.priceToFixed(value, this.symbolModel);

			switch (type) {
				case CUSTOM_EVENT_TYPE_ALARM:
					labelEl.children[0].style.borderRightColor = 'yellow';
					labelEl.children[1].style.background = 'yellow';
					labelEl.children[0].style.zIndex = labelEl.children[1].style.zIndex = 1;
					options.color = 'yellow';
					options.dashStyle = 'dash';
					break;
				case CUSTOM_EVENT_TYPE_ALARM_NEW:
					labelEl.children[0].style.borderRightColor = 'orange';
					labelEl.children[1].style.background = 'orange';
					labelEl.children[0].style.zIndex = labelEl.children[1].style.zIndex = 11;
					options.color = 'orange';
					options.dashStyle = 'solid';
					options.width = 2;

					if (this._chart.yAxis[0].max < value) {
						this._chart.yAxis[0].update({max: value, min: null}, true); 
					}
					if (this._chart.yAxis[0].min > value) {
						this._chart.yAxis[0].update({min:  value, max: null}, true); 
					}	
					break;
				case CUSTOM_EVENT_TYPE_PRICE:
					labelEl.children[0].style.borderRightColor = '#67C8FF';
					labelEl.children[1].style.background = '#67C8FF';
					labelEl.children[0].style.zIndex = labelEl.children[1].style.zIndex = 10;
					options.color = '#67C8FF';
					options.dashStyle = 'dot';
					break
			}

			options.label.text = labelEl.innerHTML;

			this._chart.yAxis[0].addPlotLine(options, render, false);
		});

	}

	public removePlotLine(id, render: boolean = false) {
		if (this._chart)
			this._chart.yAxis[0].removePlotLine(id, render, false);
	}

	public setZoom(amount) {
		this.zoom += amount;
		this._updateViewPort(0, true);
	}

	public changeGraphType(type) {
		if (!this._chart)
			return;

		// this._chart.series[0].update({ type }, false, false);

		// if (type === 'line') {
		// 	this._chart.series[0].setData(this._data.candles.map(candle => [candle[0], candle[1]]), true);
		// } else if (this.graphType === 'line') {
		// 	this._chart.series[0].setData(this._data.candles, true);
		// }

		this.graphType = type;

		this.init();
	}

	public toggleTimeFrame(timeFrame: string) {
		this._destroyChart();
		this.timeFrame = timeFrame;
		this.init();
	}

	public addIndicator(name: string) {

	}

	public toggleLoading(state?: boolean) {
		// this.loadingRef.nativeElement.classList.toggle('active', !!state);
	}


	private _createChart() {

		this._zone.runOutsideAngular(() => {
			if (this._chart)
				this._destroyChart();

			var self = this;

			// create the chart
			this._chart = Highcharts.stockChart(this.chartRef.nativeElement, {

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

				yAxis: [
					{
						opposite: true,
						labels: {
							align: 'left',
							x: 6,
							y: 8,
							formatter: function () {
								return self._cacheService.priceToFixed(this.value, self.symbolModel);
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
					},
					{
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
						id: SERIES_MAIN_NAME,
						type: this.graphType,
						name: this.symbolModel.options.displayName,
						data: this._data.candles,
						cropThreshold: 0
					},
					{
						type: 'column',
						name: SERIES_VOLUME_NAME,
						data: this._data.volume,
						yAxis: 1
					},
					{
						type: 'ema',
						linkedTo: SERIES_MAIN_NAME,
						params: {
							period: 7
						}
					},
					{
						type: 'bb',
						linkedTo: SERIES_MAIN_NAME
					}
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

				this.toggleLoading(false);

				this._data.candles = data.candles;
				this._data.volume = data.volume;

				this._chart.series[0].setData(this._data.candles, false);
				this._chart.series[1].setData(this._data.volume, false);

				this._updateCurrentPricePlot();
				this._updateAlarms();
				this._updateViewPort(0, true);
			} catch (error) {
				console.log('error error error', error);
			}
		});
	}

	private _updateAlarms() {
		this._eventService.events.forEach(event => {
			if (event.symbol !== this.symbolModel.options.name)
				return;

			switch (event.type) {
				case CUSTOM_EVENT_TYPE_ALARM:
					this.updatePlotLine(event._id, event.alarm.price, CUSTOM_EVENT_TYPE_ALARM);
					break;
			}
		});
	}

	/**
	 * update current price plotline
	 * @param render 
	 */
	private _updateCurrentPricePlot(render: boolean = false) {
		this.updatePlotLine('cPrice', this.symbolModel.options.bid, CUSTOM_EVENT_TYPE_PRICE, render);
	}

	/**
	 * check how many candlesticks fit into current chart width
	 * @param checkParent 
	 */
	private _calculateViewableBars(checkParent = true) {
		let el = this._elementRef.nativeElement,
			barW = 6 * this.zoom;

		return Math.floor(el.clientWidth / barW);
	}

	/**
	 * execute on price changes
	 * @param render 
	 */
	private _onPriceChange(render: boolean = false) {
		if (this._chart && this._chart.series[0].data.length) {
			this._updateCurrentPricePlot(false);

			const lastPoint = this._chart.series[0].data[this._chart.series[0].data.length - 1];
			if (lastPoint.clientX === null)
				return;
				
			if (this.graphType === 'line') {
				this._chart.series[0].data[this._chart.series[0].data.length - 1].update({
					y: this.symbolModel.options.bid
				}, render, false);
			} else {
				this._chart.series[0].data[this._chart.series[0].data.length - 1].update({
					close: this.symbolModel.options.bid
				}, render, false);
			}
		}
	}

	/**
	 * execute on scroll
	 * @param event 
	 */
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

	private _buildLabelEl() {
		const labelHTML = `
				<div style="position: absolute; left: 0; float: left; width: 0; height: 0; border-top: 7px solid transparent; border-bottom: 7px solid transparent; border-right: 7px solid blue;"></div>
				<span style="position: absolute; left: 7px; color: black; font-size: 12px; padding-right: 2px;"></span>
		`
		this._labelEl = document.createElement('div');
		this._labelEl.innerHTML = labelHTML;
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
			indicators: []
		};

		this._chart = null;
	}

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

		return { candles, volume };
	}

	private _destroy() {
		if (this._changeSubscription)
			this._changeSubscription.unsubscribe();

		if (this._priceSubscription)
			this._priceSubscription.unsubscribe();

		if (this._orderSubscription)
			this._orderSubscription.unsubscribe();

		this._destroyChart();
	}

	async ngOnDestroy() {
		this._labelEl = null;
		this.chartRef.nativeElement.removeEventListener('mousewheel', <any>this._onScrollBounced);

		this._destroy();
	}
}