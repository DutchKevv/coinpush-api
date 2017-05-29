import {Component, OnInit, AfterViewInit, ElementRef, Output} from '@angular/core';
import {CookieService} 				from 'ngx-cookie';
import {FormBuilder, FormGroup}     from '@angular/forms';
import {IMultiSelectOption, IMultiSelectSettings}   from 'angular-2-dropdown-multiselect';
import {BacktestSettingsModel}      from './backtest-settings.model';
import {SocketService}              from '../../services/socket.service';
import * as moment                  from 'moment';
import {InstrumentsService} 		from '../../services/instruments.service';

@Component({
	selector: 'backtest-settings',
	templateUrl: './backtest-settings.component.html',
	styleUrls: ['./backtest-settings.component.scss']
})

export class BacktestSettingsComponent implements OnInit, AfterViewInit {

	@Output() isRunning = false;

	public EAList = [];

	public multiSelectOptions: IMultiSelectOption[] = [
		<any>{id: 'EUR_USD', name: 'EUR_USD'},
		<any>{id: 'USD_CAD', name: 'USD_CAD'}
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
	public model: BacktestSettingsModel;
	public report: any = null;

	private _$el: any;

	constructor(private _cookieService: CookieService,
				private _instrumentService: InstrumentsService,
				private formBuilder: FormBuilder,
				private _socketService: SocketService,
				private _elementRef: ElementRef) {
	}

	ngOnInit(): void {
		this._$el = $(this._elementRef.nativeElement);

		this.model = new BacktestSettingsModel(this._getCookie());

		// For same reason the MultiSelect plugin brakes when restoring from cookies
		// Solution is to leave it empty until instrumentList$ emits and then restore it
		let temp = this.model.data.instruments;
		this.model.data.instruments = [];

		this.model.data.from = BacktestSettingsModel.parseDate(this.model.data.from);
		this.model.data.until = BacktestSettingsModel.parseDate(this.model.data.until);

		this.form = this.formBuilder.group(this.model.data);

		this._socketService.socket.on('editor:runnable-list', (runnableList) => this._onReceiveRunnableList(runnableList));
		this._socketService.socket.emit('editor:runnable-list', undefined, (err, runnableList) => this._onReceiveRunnableList(runnableList));


		this._instrumentService.instrumentList$.subscribe(instrumentList => {
			if (instrumentList.length) {
				this.multiSelectOptions = instrumentList.map(instrument => ({id: instrument.instrument, name: instrument.instrument}));

				// Restore instrument list here
				this.model.data.instruments = temp;
			}
		});
	}

	ngAfterViewInit() {
		this.form.valueChanges.subscribe(() => this.saveSettings());
	}

	public run() {
		this.report = null;
		this.isRunning = true;
		this._toggleLoading(true);

		let data = Object.assign({}, this.model.data, {
			from: moment(this.model.data.from, 'YYYY-MM-DD').valueOf(),
			until: moment(this.model.data.until, 'YYYY-MM-DD').valueOf()
		});

		this._socketService.socket.emit('backtest:run', data, (err, report) => {
			this.report = report;
			this.isRunning = false;
			this._toggleLoading(false);
		});
	}

	public saveSettings(): void {
		this._cookieService.put('backtest-settings', this.model.toJson());
	}

	private _getCookie(): Object {
		let data = {};

		try {
			data = JSON.parse(this._cookieService.get('backtest-settings'));
		} catch (err) {}

		return data;
	}

	private _toggleLoading(state: boolean) {
		$(this._elementRef.nativeElement).find('input, select, button').prop('disabled', !!state);
	}


	private _onReceiveRunnableList(runnableList) {
		this.EAList = runnableList.ea;
	}
}