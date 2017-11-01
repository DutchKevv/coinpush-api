import {forEach, random, throttle} from 'lodash';
import {
	Component, OnDestroy, ElementRef, Input, ViewChild,
	OnInit, AfterViewInit, ViewEncapsulation, NgZone, Output, SimpleChanges, OnChanges
} from '@angular/core';

import {DialogComponent} from '../dialog/dialog.component';
import {InstrumentsService} from '../../services/instruments.service';
import {DialogAnchorDirective} from '../../directives/dialoganchor.directive';
import {InstrumentModel} from '../../models/instrument.model';
import * as interact from 'interactjs';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {CacheService} from '../../services/cache.service';
import * as moment from 'moment';
import {OrderService} from '../../services/order.service';
import {ConstantsService} from '../../services/constants.service';
import {BaseModel} from '../../models/base.model';
import {SymbolModel} from "../../models/symbol.model";

declare let $: any;

@Component({
	selector: 'chart-box',
	templateUrl: './chart-box.component.html',
	styleUrls: [
		'./chart-box.component.scss'
	],
	encapsulation: ViewEncapsulation.Native,
	// changeDetection: ChangeDetectionStrategy.OnPush,
	entryComponents: [DialogComponent]
})


export class ChartBoxComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {

	@Input() instrumentModel: InstrumentModel;
	@Input() symbolModel: SymbolModel;

	@Input() showBox: Boolean = false;
	@Input() quickBuy: Boolean = false;
	@Output() loading$ = new BehaviorSubject(true);

	@ViewChild(DialogAnchorDirective) private _dialogAnchor: DialogAnchorDirective;
	@ViewChild('candles') private _candlesRef: ElementRef;
	@ViewChild('volume') private _volumeRef: ElementRef;

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

	public static readonly DEFAULT_CHUNK_LENGTH = 1000;
	public static readonly VIEW_STATE_WINDOWED = 1;
	public static readonly VIEW_STATE_STRETCHED = 2;
	public static readonly VIEW_STATE_MINIMIZED = 3;

	public static _prepareData(data: any) {
		let i = 0,
			rowLength = 10,
			length = data.length,
			volume = new Array(length / rowLength),
			candles = new Array(length / rowLength);

		// TODO - Volume
		for (; i < length; i += rowLength) {
			let date = moment(data[i]).format('DD-MM hh:mm'),
				c = i / rowLength;

			candles[c] = {time: data[i], y: [data[i + 1], data[i + 3], data[i + 5], data[i + 7]]};
			volume[c] = {label: date, y: data[i + 9]};
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
	}

	ngOnInit() {
		if (!this.symbolModel && !this.instrumentModel)
			throw new Error('symbol or instrument model required');

		if (this.instrumentModel) {
			if (!this.symbolModel)
				this.symbolModel = this._cacheService.getBySymbol(this.instrumentModel.options.symbol);

		} else {
			this.instrumentModel = new InstrumentModel({
				symbol: this.symbolModel.options.name
			});
		}

		this.$el = $(this._elementRef.nativeElement);
		this._onScrollBounced = throttle(this._onScroll.bind(this), 33);

		this._restoreStyles();
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
		this._orderService.create({symbol: this.instrumentModel.options.symbol, side, amount});
	}

	ngAfterViewInit() {

	}

	public changeGraphType() {
		if (!this._chart)
			return;

		this._chart.options.data[0].type = this.instrumentModel.options.graphType;
	}

	public reflow() {
		if (!this._chart)
			return;

		this._chartVolume.options.height = this._volumeRef.nativeElement.clientHeight;
		this._chartVolume.options.width = this._volumeRef.nativeElement.clientWidth;
		this._chart.options.height = this._candlesRef.nativeElement.clientHeight;
		this._chart.options.width = this._candlesRef.nativeElement.clientWidth;

		this._updateViewPort();
	}

	public render() {
		if (!this._chart)
			return;

		this._chart.render();
		this._chartVolume.render();
	}

	public toggleTimeFrame() {
		this.loading$.next(true);
		this._fetchCandles();
		// this._fetchIndicators(ChartBoxComponent.DEFAULT_CHUNK_LENGTH, this._offset);
	}

	private _createChart() {
		this._zone.runOutsideAngular(() => {

			this._destroyChart();

			let chartOptions = {
				interactivityEnabled: true,
				exportEnabled: false,
				animationEnabled: false,
				backgroundColor: '#000',
				dataPointWidth: 2,
				creditText: '',
				toolTip: {
					animationEnabled: false,
					borderThickness: 0,
					cornerRadius: 0
				},
				scales: {
					xAxes: [{
						display: false
					}]
				},

				axisY2: {
					includeZero: false,
					// title: 'Prices',
					// prefix: '$',
					labelFontColor: '#fff',
					labelFontSize: '12',
					gridDashType: 'dash',
					gridColor: '#787D73',
					gridThickness: 0.5,
					stripLines: [{
						value: 0,
						label: '',
						labelPlacement: 'outside',
						labelAlign: 'far',
						labelBackgroundColor: '#959598',
						labelFontColor: '#000',
						thickness: 0.5,
						color: '#d2d2d5'
					}],
					tickThickness: 0.5,
					lineThickness: 1.5,
					labelMinWidth: 50,
					labelMaxWidth: 50
				},
				axisX: {
					includeZero: false,
					labelFontColor: '#fff',
					labelFontSize: '12',
					gridDashType: 'dash',
					gridColor: '#787D73',
					gridThickness: 0.5,
					tickThickness: 0,
					valueFormatString: ' ',
					labelFormatter: function(e){
						return  ''
					},
					lineThickness: 1
				},
				data: [
					{
						type: this.instrumentModel.options.graphType,
						connectNullData: false,
						// fillOpacity: 0,
						// risingColor: '#000000',
						color: '#1381ff',
						risingColor: '#17EFDA',
						dataPoints: this._data.candles,
						axisYType: 'secondary',
						bevelEnabled: false,
						thickness: 1
					},
					{
						type: 'line',
						connectNullData: false,
						bevelEnabled: false,
						markerType: 'triangle',
						lineThickness: 1,
						markerSize: 10,
						dataPoints: [],
						axisYType: 'secondary',
						valueFormatString: ' ',
						toolTipContent: '#{id}</br>Profit: {profit}'
					}
				]
			};

			this._chart = new window['CanvasJS'].Chart(this._candlesRef.nativeElement, chartOptions);
			this._chartVolume = new window['CanvasJS'].Chart(this._volumeRef.nativeElement, {
				exportEnabled: false,
				animationEnabled: false,
				backgroundColor: '#000',
				dataPointWidth: 2,
				creditText: '',
				toolTip: {
					animationEnabled: false,
					borderThickness: 0,
					cornerRadius: 0
				},
				axisX: {
					includeZero: false,
					labelFontColor: '#fff',
					labelFontSize: '12',
					gridDashType: 'dash',
					gridColor: '#787D73',
					gridThickness: 0.5,
					tickThickness: 0
				},
				axisY2: {
					includeZero: false,
					// title: 'Prices',
					// prefix: '$',
					labelFontColor: '#fff',
					labelFontSize: '12',
					gridDashType: 'dash',
					gridColor: '#787D73',
					gridThickness: 0.5,
					tickThickness: 0
				},
				data: [
					{
						type: 'column',
						dataPoints: this._data.volume,
						connectNullData: false,
						bevelEnabled: false,
						axisYType: 'secondary',
						color: 'white'
					}
				]
			});
			this._candlesRef.nativeElement.addEventListener('mousewheel', <any>this._onScrollBounced);
			this._updateViewPort();
			this._updateIndicators();
			this._updateOrders();

			this._oCanvasMouseMoveFunc = this._chart._mouseEventHandler;
			this._chart._mouseEventHandler = event => {
				if (this._mouseActive)
					this._oCanvasMouseMoveFunc.call(this._chart, event);
			};
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

			this._chart.options.axisX.viewportMinimum = data.length - offset - viewable;
			this._chartVolume.options.axisX.viewportMinimum = data.length - offset - viewable;
			this._chart.options.axisX.viewportMaximum = data.length - offset + 2;
			this._chartVolume.options.axisX.viewportMaximum = data.length - offset + 2;
		});
	}

	private _fetchCandles() {
		this._zone.runOutsideAngular(async () => {
			try {
				let data: any = ChartBoxComponent._prepareData(await this._cacheService.read({
					symbol: this.instrumentModel.options.symbol,
					timeFrame: this.instrumentModel.options.timeFrame,
					until: this.instrumentModel.options.type === 'backtest' && this.instrumentModel.options.status.progress < 1 ? this.instrumentModel.options.from : this.instrumentModel.options.until,
					count: ChartBoxComponent.DEFAULT_CHUNK_LENGTH,
					offset: this._offset
				}));

				this._data.candles.push(...data.candles);
				this._data.volume.push(...data.volume);

				if (!this._chart)
					this._createChart();

				this._updateCurrentPricePlot();
				this._updateViewPort();
				this.render();
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

			this._chart.options.axisY2.stripLines[0].value = lastCandle.y[2];
			this._chart.options.axisY2.stripLines[0].label = lastCandle.y[2];
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

		// this._zone.runOutsideAngular(() => {
		//
		// 	orders.forEach((order: any) => {
		// 		if (order.closeTime < this._chart.options.data[0].dataPoints[0].time)
		// 			return;
		//
		// 		this._chart.options.data[1].dataPoints.push(...[
		// 				{
		// 					// label: moment(order.openTime).format('DD-MM hh:mm'),
		// 					// x: this._chart.options.data[0].dataPoints.find(point => point.time === order.openTime).x,
		// 					y: null,
		// 					lineColor: order.side === 'sell' ? '#ff00e1' : '#007fff',
		// 					color: order.profit > 0 ? '#01ff00' : 'red',
		// 					id: order.id,
		// 					profit: order.profit
		// 					// lineColor: 'red'
		// 				},
		// 				{
		// 					// label: moment(order.openTime).format('DD-MM hh:mm'),
		// 					x: this._chart.options.data[0].dataPoints.findIndex(point => point.time === order.openTime),
		// 					y: order.openBid,
		// 					lineColor: order.side === 'sell' ? '#ff00e1' : '#007fff',
		// 					color: order.profit > 0 ? '#01ff00' : 'red',
		// 					id: order.id,
		// 					profit: order.profit
		// 				},
		// 				{
		// 					// label: moment(order.closeTime).format('DD-MM hh:mm'),
		// 					x: this._chart.options.data[0].dataPoints.findIndex(point => point.time === order.closeTime),
		// 					y: order.closeBid,
		// 					id: order.id,
		// 					profit: order.profit,
		// 					// lineColor: order.type === 'sell' ? '#ff00e1' : '#007fff',
		// 					color: order.profit > 0 ? '#01ff00' : 'red'
		// 					// lineColor: 'red'
		// 				}
		// 			]
		// 		);
		// 	});
		// });
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

	public _restoreStyles(styles?: { x?: any, y?: any, z?: any, w?: any, h?: any }): void {
		styles = styles || <any>JSON.parse(localStorage.getItem(`instrument-${this.instrumentModel.options.id}-p`));

		if (styles) {
			this.toggleViewState('windowed');
			this.setStyles(styles);
		}
		else {
			this.toggleViewState('windowed');
			this.setRandomPosition();
			this.storeStyles();
		}
	}

	public setRandomPosition() {
		let el = this._elementRef.nativeElement,
			containerH = el.parentNode.clientHeight,
			containerW = el.parentNode.clientWidth,
			chartH = el.clientHeight,
			chartW = el.clientWidth;

		this.setStyles({
			x: random(0, containerW - chartW),
			y: Math.max(random(0, containerH - chartH), 0)
		});
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
		const lastCandle = this._data.candles[this._data.candles.length -1];

		if (!lastCandle)
			return;
		
		lastCandle.y[2] = options.ask;
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
		this._chart.options.toolTip.enabled = false;
		this._onScrollTooltipTimeout = setTimeout(() => {
			this._chart.options.toolTip.enabled = true;
			this._mouseActive = true;
			this.render();
		}, 500);
		this._chart.toolTip.hide();

		this._updateViewPort(event.wheelDelta > 0 ? -shift : shift);

		this.render();

		return false;
	}

	private _destroyChart() {
		this._candlesRef.nativeElement.removeEventListener('mousewheel', <any>this._onScrollBounced);

		if (this._chart)
			this._chart.destroy();
	}

	async ngOnDestroy() {
		this._changeSubscription.unsubscribe();
		this._priceSubscription.unsubscribe();
		this._orderSubscription.unsubscribe();
		this._destroyChart();
		this._data = null;
		this.$el = null;
	}
}