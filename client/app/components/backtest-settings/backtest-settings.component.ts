import {
	Component, OnInit, AfterViewInit, ElementRef, Output, ChangeDetectionStrategy, NgZone,
	Pipe, PipeTransform, ViewEncapsulation
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

declare let $: any;

@Pipe({name: 'groupBy'})
export class GroupByPipe implements PipeTransform {
	transform(value: Array<any>, field: string): Array<any> {
		field = field || 'groupId';

		const groupedObj = value.reduce((prev, cur)=> {
			// if (typeof cur.options[field] === 'undefined')
			// 	return prev;

			if(!prev[cur.options[field]]) {
				prev[cur.options[field]] = [cur];
			} else {
				prev[cur.options[field]].push(cur);
			}
			return prev;
		}, {});
		console.log('groupedObj groupedObj', groupedObj);
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
				private _cookieService: CookieService,
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

		storedData.from = InstrumentModel.parseUnixToString(+storedData.from);
		storedData.until = InstrumentModel.parseUnixToString(+storedData.until);

		this.model.set(storedData);
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
		});

		this._cacheService.symbolList$.subscribe(symbolList => {
			this.multiSelectOptions = symbolList.map(symbol => ({id: symbol.options.name, name: symbol.options.name}));
			this.model.set({symbols: selectedSymbols});
		});
	}

	ngAfterViewInit() {
		$(this._elementRef.nativeElement.shadowRoot.querySelectorAll('.dropdown-toggle')).dropdown();
	}


	public async create() {
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

		this.instrumentsService.create(options);
	}


	public saveSettings(): void {
		let settings = JSON.stringify(Object.assign(
			{},
			this.model.options,
			{
				from: InstrumentModel.parseDateStringToUnix(this.model.options.from),
				until: InstrumentModel.parseDateStringToUnix(this.model.options.until)
			})
		);

		this._cookieService.put('backtest-settings', settings);
	}

	private _onReceiveRunnableList(runnableList) {
		this.EAList = runnableList.ea;
	}

	private _getCookie(): IBacktestSettings {
		try {
			return JSON.parse(this._cookieService.get('backtest-settings'));
		} catch (err) {
			return {};
		}
	}
}
