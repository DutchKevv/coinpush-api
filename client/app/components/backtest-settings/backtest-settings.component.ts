import {
	Component, OnInit, AfterViewInit, ElementRef, Output, ChangeDetectionStrategy, NgZone,
	ChangeDetectorRef, Pipe, PipeTransform
} from '@angular/core';
import {CookieService}                from 'ngx-cookie';
import {FormBuilder, FormGroup}        from '@angular/forms';
import {IMultiSelectOption, IMultiSelectSettings}   from 'angular-2-dropdown-multiselect';
import {SocketService}              from '../../services/socket.service';
import {CacheService}                from '../../services/cache.service';
import {IBacktestSettings}            from '../../../../shared/interfaces/BacktestSettings';
import {InstrumentsService} from '../../services/instruments.service';
import {InstrumentModel} from '../../../../shared/models/InstrumentModel';
import {BaseModel} from '../../../../shared/models/BaseModel';

@Pipe({name: 'groupBy'})
export class GroupByPipe implements PipeTransform {
	transform(value: Array<any>, field: string): Array<any> {
		const groupedObj = value.reduce((prev, cur)=> {
			if(!prev[cur.options[field]]) {
				prev[cur.options[field]] = [cur];
			} else {
				prev[cur.options[field]].push(cur);
			}
			return prev;
		}, {});
		return Object.keys(groupedObj).map(key => ({ key, value: groupedObj[key] }));
	}
}

export class BacktestSettingsModel extends BaseModel {
	public static readonly DEFAULTS = {
		ea: [],
		symbols: [],
		timeFrame: '',
		from: Date.now() - (1000 * 60 * 60 * 24 * 14), // 2 weeks
		until: Date.now(),
		pips: 1,
		leverage: 1,
		startEquality: 10000,
		currency: 'EURO'
	}
}

@Component({
	selector: 'backtest-settings',
	templateUrl: './backtest-settings.component.html',
	styleUrls: ['./backtest-settings.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class BacktestSettingsComponent implements OnInit, AfterViewInit {

	@Output() public isRunning = false;

	public model: BacktestSettingsModel;
	public EAList = [];

	public multiSelectOptions: IMultiSelectOption[] = [
		<any>{id: 'AUD_JPY', name: 'AUD_JPY'},
		<any>{id: 'AUD_CAD', name: 'AUD_CAD'}
	];

	public multiSelectSettings: IMultiSelectSettings = {
		buttonClasses: 'btn btn-multi-select',
		maxHeight: '300px',
		checkedStyle: 'fontawesome',
		dynamicTitleMaxItems: 2,
		selectionLimit: 10,
		showUncheckAll: true,
		enableSearch: true
	};

	public form: FormGroup;

	private _elProgressBar: HTMLElement = null;

	constructor(private _changeDetectorRef: ChangeDetectorRef,
				public instrumentsService: InstrumentsService,
				private _zone: NgZone,
				private _cookieService: CookieService,
				private _cacheService: CacheService,
				private formBuilder: FormBuilder,
				private _socketService: SocketService,
				private _elementRef: ElementRef) {
	}

	ngOnInit(): void {
		this._elProgressBar = this._elementRef.nativeElement.querySelector('.progress-bar');

		this.model = new BacktestSettingsModel();
		this.form = this.formBuilder.group(this.model.options);

		this._socketService.socket.on('cache:fetch:status', (data) => {
			console.log('CACHE FETCH STATUS!!', data);
		});

		this._socketService.socket.on('editor:runnable-list', (err, runnableList) => alert(err) || this._onReceiveRunnableList(runnableList));
		this._socketService.socket.emit('editor:runnable-list', undefined, (err, runnableList) => {
			if (err)
				return alert(err);

			this._onReceiveRunnableList(runnableList);
		});

		this._socketService.socket.on('backtest:status', (status) => this._onStatusUpdate(status));


		this._cacheService.symbolList$.subscribe(symbolList => {
			this.multiSelectOptions = symbolList.map(symbol => ({id: symbol.options.name, name: symbol.options.name}));
		});
	}

	ngAfterViewInit() {
		this.model.set(Object.assign(this._getCookie(), {
			from: InstrumentModel.parseUnixToString(this.model.options.from),
			until: InstrumentModel.parseUnixToString(this.model.options.until)
		}, false));

		this.form.valueChanges.subscribe(() => this.saveSettings());
	}


	public async create() {
		this._toggleLoading(true);

		let data = Object.assign({}, this.model.options, {
			from: InstrumentModel.parseDateStringToUnix(this.model.options.from),
			until: InstrumentModel.parseDateStringToUnix(this.model.options.until),
		});

		let options = data.symbols.map(symbol => {
			return Object.assign({}, data, {
				type: 'backtest',
				symbol: symbol
			});
		});

		console.log(data);

		this.instrumentsService.create(options);
	}


	public saveSettings(): void {
		this._cookieService.put('backtest-settings', JSON.stringify(Object.assign(
			{},
			this.model.options,
			{
				from: InstrumentModel.parseDateStringToUnix(this.model.options.from),
				until: InstrumentModel.parseDateStringToUnix(this.model.options.until)
			})
		));
	}

	private _onReceiveRunnableList(runnableList) {
		this.EAList = runnableList.ea;
	}

	private _onStatusUpdate(data) {
		let {id, status} = data;

		switch (status.status) {
			case 'fetch:start':
				this._updateProgressBar('info', `Fetching 0 %`);
				break;
			case 'fetch:update':
				this._updateProgressBar('info', `Fetching ${status.value} %`, status.value);
				break;
			case 'fetch:done':
				this._updateProgressBar('info', `Fetching done`, 100);
				break;
			case 'instrument:update':
				console.log(id, status.report);
				this._zone.run(() => {
					// let backtest = this.backtestService.getById(id);
					// console.log('backtestService', this.backtestService.backtests$.getValue());
					//
					// if (!backtest)
					// 	return console.warn('Backtest with id ' + id + ' not found');
					//
					// console.log('instrument:update update update', status.report);
					// backtest.options.reports[backtest.getReportIndexById(status.report.id)] = status.report;
					// this._changeDetectorRef.markForCheck();
				});

				this._updateProgressBar('success', `Running ${status.value} %`, status.value);
				break;
			case 'done':
				this._zone.run(() => {
					// this.backtestService.getById(id).set({report: status.report});
					this._changeDetectorRef.markForCheck();
				});

				// console.log(status.report);
				this._toggleLoading(false);
				this._updateProgressBar('success', `Finished`, 100);
				break;
			case 'error':
				this._updateProgressBar('error', `Error`, 100);
				break;
			case 'default':
				throw new Error('Unknown backtest progress status');
		}
	}

	private _updateProgressBar(type: string, text = '', value = 0) {
		requestAnimationFrame(() => {
			this._elProgressBar.previousElementSibling.textContent = text;
			this._elProgressBar.classList.toggle('active', value && value < 100);
			this._elProgressBar.classList.remove(...['info', 'success', 'error'].map(str => 'progress-bar-' + str));
			this._elProgressBar.classList.add('progress-bar-' + type);
			this._elProgressBar.style.width = value + '%';
			this._changeDetectorRef.markForCheck();
		});
	}

	private _toggleLoading(state: boolean) {
		$(this._elementRef.nativeElement).find('input, select, button').prop('disabled', !!state);
	}

	private _getCookie(): IBacktestSettings {
		let data = {};

		try {
			data = JSON.parse(this._cookieService.get('backtest-settings'));
		} catch (err) {
		}

		return data;
	}
}
