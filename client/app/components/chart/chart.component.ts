import {throttle} from 'lodash';

import {
	ElementRef, OnInit, Input, Component, ChangeDetectionStrategy, OnDestroy, NgZone,
	ViewEncapsulation, AfterViewInit, ViewChild, Output, ChangeDetectorRef
} from '@angular/core';

import {InstrumentsService} from '../../services/instruments.service';
import {InstrumentModel} from '../../../../shared/models/InstrumentModel';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {CacheService} from '../../services/cache.service';

@Component({
	selector: 'chart',
	exportAs: 'chart',
	styleUrls: ['./chart.component.scss'],
	templateUrl: './chart.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.Native
})

export class ChartComponent implements OnInit, AfterViewInit, OnDestroy {
	public static readonly DEFAULT_CHUNK_LENGTH = 1000;

	@Input() model: InstrumentModel;
	@Output() loading$ = new BehaviorSubject(true);

	private _offset = 0;
	private _scrollOffset = -1;
	private _scrollSpeedStep = 6;
	private _scrollSpeedMin = 1;
	private _scrollSpeedMax = 20;

	private _chart: any;
	private _chartEl: HTMLElement = null;
	private _onScrollBounced: Function = null;

	constructor(private _zone: NgZone,
				private _elementRef: ElementRef,
				private _instrumentsService: InstrumentsService,
				private _cacheService: CacheService) {
	}

	public async ngOnInit() {
		this._onScrollBounced = throttle(this._onScroll.bind(this), 33);

		this._chartEl = this._elementRef.nativeElement.shadowRoot.lastElementChild;
		this._chartEl.addEventListener('mousewheel', <any>this._onScrollBounced);

		this._fetchCandles();

		if (this.model.options.id) {
			this._fetchIndicators(ChartComponent.DEFAULT_CHUNK_LENGTH, this._offset);
		} else {
			let subscription = this.model.changed$.subscribe(() => {
				if (this.model.options.id) {
					subscription.unsubscribe();
					this._fetchIndicators(ChartComponent.DEFAULT_CHUNK_LENGTH, this._offset);
				}
			});
		}

		this._createChart();

		this.model.changed$.subscribe(changes => {
			changes.forEach(change => {
				switch (change) {
					// case 'zoom':
					// 	if (this._chart)
					// 		this._updateViewPort();
					// 	break;
					case 'graphType':
						this.changeGraphType(this.model.options.graphType);
						break;
					// case 'timeFrame':
					// 	this.toggleTimeFrame(changes[key]);
					// 	break;
					// case 'indicator':
					// 	let change = changes[key];
					// 	if (change.type === 'add') {
					// 		let indicator = this.model.options.indicators.find(i => i.id === change.id);
					//
					// 		// this._updateIndicators([indicator]);
					// 	}
					// 	break;
				}
			});
		});
	}

	ngAfterViewInit(): void {



	}

	public changeGraphType(type) {
		if (!this._chart)
			return;

		this._chart.options.data[0].type = type;
		this._chart.render();
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
		if (!this._chart)
			return;

		this._updateViewPort();
		this._chart.options.height = this._elementRef.nativeElement.clientHeight;
		this._chart.options.width = this._elementRef.nativeElement.clientWidth;
	}

	public render() {
		if (!this._chart)
			return;

		this._chart.render();
		console.log('RENDER CALLED!');
	}

	public toggleTimeFrame(timeFrame) {
		// this._toggleLoading(true);
		// this._createChart();
		// this._toggleLoading(false);
	}

	private _createChart() {
		this._zone.runOutsideAngular(() => {
			
			this._destroyChart();

			this._chart = new window['CanvasJS'].Chart(this._chartEl, {
				interactivityEnabled: true,
				exportEnabled: false,
				animationEnabled: false,
				backgroundColor: '#000',
				axisY: {
					includeZero: false,
					// title: 'Prices',
					// prefix: '$',
					labelFontColor: '#fff',
					labelFontSize: '12',
					gridDashType: 'dash',
					gridColor: '#787D73',
					gridThickness: 1,
					stripLines: [{
						value: 0
					}]
				},
				toolTip:{
					animationEnabled: false,
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
		});
	}

	private _updateViewPort(shift = 0) {
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
		});
	}

	private _fetchIndicators(count: number, offset: number) {
		this._zone.runOutsideAngular(async () => {
			let data;

			if (this.model.options.type === 'backtest')
				data = await this._instrumentsService.fetch(this.model, count, offset, undefined, this.model.options.from);
			else
				data = await this._instrumentsService.fetch(this.model, count, offset);

			if (!data.indicators.length)
				return;

			this._updateIndicators(data.indicators);

			// Only render if candles are also present;
			if (this._chart.options.data[0].dataPoints.length)
				this.render();
		});
	}

	private _fetchCandles() {
		this._zone.runOutsideAngular(async () => {
			try {
				let candles:any = await this._cacheService.read({
					symbol: this.model.options.symbol,
					timeFrame: this.model.options.timeFrame,
					until: this.model.options.type === 'backtest' ? this.model.options.from :  this.model.options.until,
					count: ChartComponent.DEFAULT_CHUNK_LENGTH,
					offset: this._offset
				});

				this.loading$.next(false);
				this._updateBars(candles);
				this.render();
			} catch (error) {
				this.loading$.next(false);
				console.log('error error error', error);
			}
		});
	}

	private _updateOrders(orders: Array<any>) {
		this._zone.runOutsideAngular(() => {
			this._chart.get('orders').setData(orders.map(order => [order.openTime, order.bid, null]));
		});
	}

	private _updateBars(rawData: any[] = []): void {
		this._zone.runOutsideAngular(() => {
			let data = ChartComponent._prepareData(rawData),
				last = data.candles[data.candles.length - 1];

			this._chart.options.data[0].dataPoints = data.candles;
			this._setCurrentPricePlot(last);
			this._updateViewPort();
		});
	}

	private _setCurrentPricePlot(bar): void {
		if (!bar)
			return;

		this._zone.runOutsideAngular(() => {
			this._chart.options.axisY.stripLines[0].value = bar.y[2];
			this._chart.options.axisY.stripLines[0].label = bar.y[2];
		});
	}

	private _updateIndicators(indicators) {
		this._zone.runOutsideAngular(() => {
			indicators.forEach(indicator => {
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
								let newSeries = {
									type: drawBuffer.type,
									color: drawBuffer.style.color,
									name: indicator.id,
									dataPoints: drawBuffer.data.map(point => ({
										x: new Date(point[0]),
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
				});
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

		this._updateViewPort(event.wheelDelta > 0 ? -shift : shift);

		this.render();

		return false;
	}

	static _prepareData(data: any) {
		let i = 0,
			rowLength = 10,
			length = data.length,
			volume = new Array(length / rowLength),
			candles = new Array(length / rowLength);

		// TODO - Volume
		for (; i < length; i += rowLength)
			candles[i / rowLength] = {x: new Date(data[i]), y: [data[i + 1], data[i + 3], data[i + 5], data[i + 7]]};

		return {
			candles: candles,
			volume: volume
		};
	}

	private _destroyChart() {
		if (this._chart)
			this._chart.destroy();
	}

	public ngOnDestroy() {
		this._chartEl.removeEventListener('mousewheel', <any>this._onScrollBounced);
		this._destroyChart();
	}
}