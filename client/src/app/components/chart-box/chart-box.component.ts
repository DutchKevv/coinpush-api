// import * as throttle from 'lodash/throttle';
import {
	Component, OnDestroy, ElementRef, Input, ViewChild,
	OnInit, AfterViewInit, NgZone, Output, SimpleChanges, OnChanges, ChangeDetectionStrategy, ViewEncapsulation, ChangeDetectorRef, HostListener
} from '@angular/core';
import { CacheService } from '../../services/cache.service';
import { SymbolModel } from "../../models/symbol.model";
import { EventService } from '../../services/event.service';
import { BehaviorSubject } from 'rxjs';
import { CUSTOM_EVENT_TYPE_ALARM, CUSTOM_EVENT_TYPE_PRICE, CUSTOM_EVENT_TYPE_ALARM_NEW } from 'coinpush/constant';
import { EventModel } from '../../models/event.model';

// for some reason typescript gives all kind of errors when using the @types/node package
// so this is a quick / temp fix
declare var require: any;

const HighStock = require('highcharts/highstock');
require('highcharts/modules/exporting')(HighStock);
require('highcharts/indicators/indicators')(HighStock);
require('highcharts/indicators/bollinger-bands')(HighStock);
require('highcharts/indicators/cci')(HighStock);
require('highcharts/indicators/ema')(HighStock);
require('highcharts/indicators/macd')(HighStock);
require('highcharts/indicators/momentum')(HighStock);
require('highcharts/indicators/mfi')(HighStock);
// require('highcharts/indicators/sma')(HighStock);
require('highcharts/indicators/wma')(HighStock);
require('highcharts/indicators/zigzag')(HighStock);
// import * as bollingerBands from 'highcharts/indicators/bollinger-bands';
// import * as atr from 'highcharts/indicators/atr';
// import * as rsi from 'highcharts/indicators/rsi';

// bollingerBands(HighStock);
// ema(HighStock);
import '../../..//etc/custom/js/highcharts/highstock.theme.dark.js';
import { IndicatorService } from '../../services/indicator.service';
import { app } from 'core/app';

const SERIES_MAIN_NAME = 'main';
const SERIES_VOLUME_NAME = 'volume';

@Component({
	selector: 'app-chart-box',
	templateUrl: './chart-box.component.html',
	styleUrls: [
		'./chart-box.component.scss'
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartBoxComponent implements OnDestroy, AfterViewInit, OnChanges {
	@Input() symbolModel: SymbolModel;
	@ViewChild('chart') private chartRef: ElementRef;
	@ViewChild('loading') private loadingRef: ElementRef;

	static readonly PLOTLINE_TYPE_DEFAULT = 0;
	static readonly PLOTLINE_TYPE_NEW_ALARM = 1;
	static readonly PLOTLINE_TYPE_ALARM = 2;
	static readonly PLOTLINE_TYPE_PRICE = 100;
	static readonly DEFAULT_CHUNK_LENGTH = 350;

	public hasError: boolean = false;
	public indicatorContainerOpen$: BehaviorSubject<Boolean> = new BehaviorSubject(false);
	public indicatorContainerOpen: boolean = false;
	

	// merge defaults with custom config
	public config = Object.assign({
		zoom: app.platform.isApp ? 2 : 1,
		graphType: app.platform.isApp ? 'line' : 'candlestick',
		timeFrame: 'H1'
	}, app.storage.profileData.chartConfig || {});

	// chart data
	private _data = {
		candles: [],
		volume: [],
		plotLines: []
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
	private _eventsSubscribtion;
	private _labelEl: any;

	private _indicatorIdCounter = 0;
	private _fetchSub = null;

	private _resizeTimeout = null;
	
	/**
	 * mobile nav menu back press close
	 * @param event 
	 */
	@HostListener('window:resize', ['$event'])
	onPopState(event) {
		// this._toggleVisibility(false);
		this._toggleLoading(true);

		if (this._resizeTimeout) {
			clearTimeout(this._resizeTimeout);
		}

		this._resizeTimeout = setTimeout(() => {
			if (this._chart) {
				this._chart.reflow();
			}
			this._toggleVisibility(true);
			this._toggleLoading(false);

			clearTimeout(this._resizeTimeout);
		}, 500);
		
		return false;
	}

	/**
	 * mobile nav menu back press close
	 * @param event 
	 */
	@HostListener('scroll', ['$event'])
	onScroll(event) {
		this._onScrollBounced(event);
		return false;
	}

	constructor(
		public indicatorService: IndicatorService,
		private _zone: NgZone,
		private _changeDetectorRef: ChangeDetectorRef,
		private _cacheService: CacheService,
		private _eventService: EventService,
		private _elementRef: ElementRef) {
		this._changeDetectorRef.detach();
		this._buildLabelEl();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.symbolModel && changes.symbolModel.currentValue) {
			this.init();
			this._changeDetectorRef.detectChanges();
		} else {
			this._destroyChart();
		}
	}

	ngAfterViewInit() {
		this._changeSubscription = this._cacheService.changed$.subscribe(symbols => {
			if (this.symbolModel && symbols.includes(this.symbolModel.options.name)) {
				this._onPriceChange(true);
			}
		});

		this._eventsSubscribtion = this._eventService.events$.subscribe(events => {
			this._updateAlarms(events, true);
		});

		this._onScrollBounced = this._onScroll.bind(this);
		this.chartRef.nativeElement.addEventListener('mousewheel', <any>this._onScrollBounced);
	}

	init() {
		this._toggleLoading(true);
		this._toggleError(false);

		if (!this.symbolModel)
			return;

		this._fetch();
		this._destroyChart();
	}

	/**
	 * 
	 * @param id 
	 * @param value 
	 * @param type 
	 * @param render 
	 */
	public updatePlotLine(id: string, value: number, type: number, render: boolean = false) {

		return this._zone.runOutsideAngular(() => {
			this.removePlotLine(id);

			// if (!value) {
			// 	console.log(type);
			// 	console.warn(`updatePlotline() - no value given! id: ${id}`);
			// 	value = this.symbolModel.options.bid;
			// 	console.log(this.symbolModel.options.bid);
			// }

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
					x: 1
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

					if (this._chart && this._chart.yAxis[0].max < value) {
						this._chart.yAxis[0].update({ max: value, min: null }, true);
					}
					if (this._chart && this._chart.yAxis[0].min > value) {
						this._chart.yAxis[0].update({ max: null, min: value }, true);
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

			this._data.plotLines.push(options);

			if (this._chart) {
				this._chart.yAxis[0].addPlotLine(options, render, false);
			}
		});
	}

	/**
	 * 
	 * @param id 
	 * @param render 
	 */
	public removePlotLine(id, render: boolean = false) {
		// remove from data
		this._data.plotLines.splice(this._data.plotLines.findIndex(plotLine => plotLine.id === id));

		// remove from chart
		if (this._chart)
			this._chart.yAxis[0].removePlotLine(id, render, false);
	}

	/**
	 * 
	 * @param amount 
	 */
	public setZoom(amount) {
		this.config.zoom += amount;

		// reset back to current min/max 
		// the setting could be hanging 'outside' from previous versions/releases
		if (this.config.zoom > 5) {
			this.config.zoom = 5;
		}
		else if (this.config.zoom < 0) {
			this.config.zoom = 0;
		}

		app.storage.updateProfile({chartConfig: this.config}).catch(console.error);
		this._updateViewPort(0, true);
	}

	/**
	 * 
	 * @param type 
	 * @param render 
	 */
	public changeGraphType(graphType: string, render: boolean = true) {
		if (!this._chart)
			return;

		this.config.graphType = graphType;
		app.storage.updateProfile({chartConfig: this.config}).catch(console.error);
		this._chart.series[0].update({ type: graphType }, render, false);
	}

	/**
	 * 
	 * @param timeFrame 
	 */
	public toggleTimeFrame(timeFrame: string) {
		this.config.timeFrame = timeFrame;
		app.storage.updateProfile({chartConfig: this.config}).catch(console.error);
		this.init();
	}

	/**
	 * 
	 * @param type 
	 */
	public addIndicator(type: string) {
		if (!type)
			return;

		const indicator = this.indicatorService.add(type);
		if (indicator) {
			this._zone.runOutsideAngular(() => this._chart.addSeries(indicator));
			this._changeDetectorRef.detectChanges();
		}
	}

	/**
	 * 
	 * @param id 
	 */
	public removeIndicator(id: string | number) {
		// remove from service
		this.indicatorService.remove(id);

		// remove from highcharts
		const serie = this._chart.series.find(serie => serie.userOptions.id === id);
		if (serie) {
			this._zone.runOutsideAngular(() => serie.remove());
			this._changeDetectorRef.detectChanges();
		}
	}

	/**
	 * 
	 */
	public onClickIndicatorsButton() {
		this.indicatorContainerOpen = !this.indicatorContainerOpen;
		this._changeDetectorRef.detectChanges();
	}

	private _createChart() {

		this._zone.runOutsideAngular(() => {
			var self = this;
			this._chart = HighStock.chart(this.chartRef.nativeElement, {
				chart: {
					reflow: false
				},
				plotOptions: {
					sma: {
						marker: {
							enabled: false
						},
						lineWidth: 1
					},
					bollingerBands: {
						marker: {
							enabled: false
						},
						lineWidth: 1
					},
					line: {
						lineWidth: 3
					}
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
						plotLines: this._data.plotLines
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
					},
				],
				series: [
					{
						id: SERIES_MAIN_NAME,
						type: this.config.graphType,
						name: this.symbolModel.options.displayName,
						data: this._data.candles,
						cropThreshold: 0
					},
					{
						id: SERIES_VOLUME_NAME,
						type: 'column',
						name: SERIES_VOLUME_NAME,
						data: this._data.volume,
						yAxis: 1
					},
					...this.indicatorService.indicators
				]
			}, false, false);
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

	/**
	 * 
	 */
	private _fetch() {

		if (this._fetchSub)
			this._fetchSub.unsubscribe();

		this._zone.runOutsideAngular(async () => {
			this._toggleError(false);

			try {
				this._prepareData(await this._cacheService.read({
					symbol: this.symbolModel.options.name,
					timeFrame: this.config.timeFrame,
					count: ChartBoxComponent.DEFAULT_CHUNK_LENGTH,
					offset: this._offset
				}));
	
				if (!this._chart) {
					this._createChart();
				}

				this._onPriceChange(false); // asign current price to latest candle
				this._updateCurrentPricePlot();
				this._updateAlarms();
				
				requestAnimationFrame(() => {
					this._updateViewPort(0, true);
					this._toggleLoading(false);
				});
			} catch (error) {
				console.log('error error error', error);
				this._toggleLoading(false);
				this._toggleError(true);
			}
		});
	}

	// private _fetchCandles() {

	// 	if (this._fetchSub)
	// 		this._fetchSub.unsubscribe();

	// 	this._zone.runOutsideAngular(async () => {
	// 		this._toggleError(false);
	// 		let success = false;

	// 		this._fetchSub = this._cacheService.read({
	// 			symbol: this.symbolModel.options.name,
	// 			timeFrame: this.timeFrame,
	// 			count: ChartBoxComponent.DEFAULT_CHUNK_LENGTH,
	// 			offset: this._offset
	// 		});

	// 		this._fetchSub.subscribe(data => {
	// 			this._prepareData(data);

	// 			if (!this._chart) {
	// 				this._createChart();
	// 			}

	// 			this._onPriceChange(false); // asign current price to latest candle
	// 			this._updateCurrentPricePlot();
	// 			this._updateAlarms();
	// 			this._updateViewPort(0, true);
	// 			this._toggleLoading(false);
	// 		});
	// 	});
	// }

	/**
	 * 
	 * @param events 
	 * @param render 
	 */
	private _updateAlarms(events: Array<EventModel> = this._eventService.events$.getValue(), render: boolean = false) {
		if (!this._chart)
			return;

		// filter events with correct symbol
		const selfEvents = events.filter(event => event.symbol === this.symbolModel.options.name);

		this._chart.yAxis[0].plotLinesAndBands.forEach(plot => {
			if (plot.id === 'new-alarm' || plot.id === 'cPrice')
				return;

			if (!selfEvents.find(event => event._id === plot.id))
				this.removePlotLine(plot.id, true);
		})

		selfEvents.forEach(event => {
			switch (event.type) {
				case CUSTOM_EVENT_TYPE_ALARM:
					this.updatePlotLine(event._id, event.alarm.price, CUSTOM_EVENT_TYPE_ALARM, render);
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
			barW = 6 * this.config.zoom;

		return Math.floor(el.clientWidth / barW);
	}

	/**
	 * execute on price changes
	 * @param render 
	 */
	private _onPriceChange(render: boolean = false) {
		if (this._data && this._data.candles && this._data.candles.length) {
			this._data.candles[this._data.candles.length - 1][1] = this.symbolModel.options.bid;
		}

		if (this._chart && this._chart.series[0].data.length) {
			this._updateCurrentPricePlot(false);

			const lastPoint = this._chart.series[0].data[this._chart.series[0].data.length - 1];
			if (lastPoint.clientX === null)
				return;

			if (this.config.graphType === 'line') {
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
				<div style="position: absolute; left: 0; float: left; width: 0; height: 0; border-top: 7px solid transparent; border-bottom: 7px solid transparent; border-right: 5px solid blue;"></div>
				<span style="position: absolute; left: 5px; color: black; font-size: 11px; padding-right: 2px;"></span>
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

	private _prepareData(data: any): void {
		let i = 0, rowLength = 10, length = data.length;

		this._data.volume = new Array(length / rowLength);
		this._data.candles = new Array(length / rowLength);

		for (; i < length; i += rowLength) {
			this._data.candles[i / rowLength] = [
				data[i],
				data[i + 1], // open
				data[i + 3], // high
				data[i + 5], // low
				data[i + 7] // close
			];

			this._data.volume[i / rowLength] = [
				data[i],
				data[i + 9] // the volume
			];
		}
	}

	/**
	 * 
	 * @param state 
	 */
	private _toggleLoading(state?: boolean) {
		this.loadingRef.nativeElement.classList.toggle('active', !!state);
	}

	private _toggleError(state: boolean) {
		this.hasError = !!state;
		this._changeDetectorRef.detectChanges();
	}

	private _toggleVisibility(state?: boolean) {
		if (this.chartRef.nativeElement && this.chartRef.nativeElement.children.length) {
			this.chartRef.nativeElement.children[0].style.visibility = state ? 'visible' : 'hidden';
		}
	}

	private _destroyChart(destroyData: boolean = true) {
		if (this._chart) {
			this._chart.destroy();
		}

		this._chart = null;
		this._scrollOffset = -1;

		if (destroyData) {
			this._data = null;
			this._data = {
				candles: [],
				volume: [],
				plotLines: []
			};
		}
	}

	async ngOnDestroy() {
		this._labelEl = null;
		this.chartRef.nativeElement.removeEventListener('mousewheel', <any>this._onScrollBounced);

		if (this._changeSubscription && this._changeSubscription.unsubscribe)
			this._changeSubscription.unsubscribe();

		if (this._eventsSubscribtion && this._eventsSubscribtion.unsubscribe)
			this._eventsSubscribtion.unsubscribe();
	}
}