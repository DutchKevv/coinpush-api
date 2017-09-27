import {
	Component, OnInit, AfterViewInit, ElementRef, Output, ChangeDetectionStrategy, NgZone,
	Pipe, PipeTransform, ViewEncapsulation, ChangeDetectorRef
} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {IMultiSelectOption, IMultiSelectSettings} from 'angular-2-dropdown-multiselect';
import {SocketService} from '../../services/socket.service';
import {CacheService} from '../../services/cache.service';
import {IBacktestSettings} from '../../../../shared/interfaces/BacktestSettings';
import {InstrumentsService} from '../../services/instruments.service';
import * as moment from 'moment';
import {BaseModel} from '../../models/base.model';

declare let $: any;

export class BacktestSettingsModel extends BaseModel {

	public static readonly DEFAULTS = {
		ea: ['example'],
		symbols: ['EUR_USD'],
		timeFrame: 'M15',
		from: Date.now() - (1000 * 60 * 60 * 24 * 14), // 2 weeks
		until: Date.now(),
		pips: 1,
		leverage: 1,
		startEquality: 10000,
		currency: 'euro'
	};

	public static parseUnixToString(date: number): string {
		if (typeof date === 'number')
			return moment(date).format('YYYY-MM-DD');

		return date;
	}

	public static parseDateStringToUnix(date: string) {
		if (typeof date === 'string')
			return moment(date, 'YYYY-MM-DD').valueOf();
		return date;
	}
}

@Component({
	selector: 'backtest-settings',
	templateUrl: './backtest-settings.component.html',
	styleUrls: ['./backtest-settings.component.scss'],
	encapsulation: ViewEncapsulation.Native,
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
		buttonClasses: 'custom-select',
		maxHeight: '300px',
		checkedStyle: 'fontawesome',
		dynamicTitleMaxItems: 2,
		selectionLimit: 10,
		showUncheckAll: true,
		enableSearch: true
	};

	public form: FormGroup;

	constructor(public instrumentsService: InstrumentsService,
				private _zone: NgZone,
				private _ref: ChangeDetectorRef,
				private _cacheService: CacheService,
				private formBuilder: FormBuilder,
				private _socketService: SocketService,
				private _elementRef: ElementRef) {
	}

	ngOnInit(): void {
		this.model = new BacktestSettingsModel();
		let storedData = this._getCookie(),
			selectedSymbols = storedData.symbols;

		delete storedData.symbols;

		this.model.set(storedData);

		this.model.options.from = BacktestSettingsModel.parseUnixToString(this.model.options.from);
		this.model.options.until = BacktestSettingsModel.parseUnixToString(this.model.options.until);

		this.form = this.formBuilder.group(this.model.options);

		this.form.valueChanges.subscribe(() => this.saveSettings());

		this._socketService.socket.on('cache:fetch:status', (data) => {
			console.log('CACHE FETCH STATUS!!', data);
		});

		this._socketService.socket.on('editor:runnable-list', (err, runnableList) => alert(err) || this._onReceiveRunnableList(runnableList));
		this._socketService.send('editor:runnable-list', undefined, (err, runnableList) => {
			if (err)
				return alert(err);

			this._onReceiveRunnableList(runnableList);
			this._ref.markForCheck();
		});

		this._cacheService.symbolList$.subscribe(symbolList => {
			this.multiSelectOptions = symbolList.map(symbol => ({id: symbol.options.name, name: symbol.options.name}));
			this.model.set({symbols: selectedSymbols});
			this._ref.markForCheck();
		});
	}

	ngAfterViewInit() {
		$(this._elementRef.nativeElement.shadowRoot.querySelectorAll('.dropdown-toggle')).dropdown();
	}


	public async create() {
		let data = Object.assign({}, this.model.options, {
			from: BacktestSettingsModel.parseDateStringToUnix(this.model.options.from),
			until: BacktestSettingsModel.parseDateStringToUnix(this.model.options.until),
		});

		let options = data.symbols.map(symbol => {
			return Object.assign({}, data, {
				type: 'backtest',
				symbol: symbol
			});
		});

		this.instrumentsService.create(options);
	}


	public saveSettings(): void {
		let settings = JSON.stringify(Object.assign(
			{},
			this.model.options,
			{
				from: BacktestSettingsModel.parseDateStringToUnix(this.model.options.from),
				until: BacktestSettingsModel.parseDateStringToUnix(this.model.options.until)
			})
		);

		localStorage.setItem('backtest-settings', JSON.stringify(settings));
	}

	private _onReceiveRunnableList(runnableList) {
		this.EAList = runnableList.ea;
	}

	private _getCookie(): IBacktestSettings {
		try {
			return JSON.parse(localStorage.getItem('backtest-settings'));
		} catch (err) {
			return {};
		}
	}
}
