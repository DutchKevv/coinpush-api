import {forEach} from 'lodash';
import {Injectable, Output, EventEmitter, NgZone, ChangeDetectorRef} from '@angular/core';
import {InstrumentSettings} from '../../../shared/interfaces/InstrumentSettings';
import {SocketService} from './socket.service';
import {BehaviorSubject} from 'rxjs';
import {SystemState} from '../../../shared/models/SystemState';
import {IndicatorModel} from '../models/indicator';
import {DialogComponent} from '../components/dialog/dialog.component';
import {ModalService} from './modal.service';
import {InstrumentModel} from '../../../shared/models/InstrumentModel';

@Injectable()
export class InstrumentsService {

	@Output() public changed$ = new EventEmitter();
	@Output() public instruments$: BehaviorSubject<any> = new BehaviorSubject([]);
	@Output() public groupIds$: BehaviorSubject<any> = new BehaviorSubject([]);

	private _instruments: InstrumentModel[] = [];

	get instruments() {
		return this._instruments;
	}

	constructor(private _zone: NgZone,
				private _modalService: ModalService,
				private _socketService: SocketService) {
		this.init();
	}

	public init(): void {
		// Create groups by groupId to show in backtest overview
		this.instruments$.subscribe(instruments => {
			this.groupIds$.next([...new Set(instruments.filter(val => val.options.type === 'backtest' && val.options.groupId !== null).map(val => val.options.groupId))]);
		});

		this._socketService.socket.on('instrument:created', (instrumentSettings: InstrumentSettings) => {
			// this.add(new InstrumentModel(instrumentSettings));
		});

		this._socketService.socket.on('instrument:destroyed', (instrumentSettings: InstrumentSettings) => {
			console.log('dsdfsdafsdf', 'Destroy11');
		});

		this._socketService.socket.on('instrument:status', (status) => {
			let instrument = this.getById(status.id);

			if (instrument)
				instrument.set(status);

			this.changed$.next()
		});

		this._socketService.socket.on('system:state', (systemState: SystemState) => {
			if (!systemState.booting && systemState.connected) {
				this._loadRunningInstruments();
			}
		});
	}

	public create(instruments: InstrumentSettings[]): InstrumentModel[] {
		// console.info(`Creating ${options.symbol}`);

		let now = Date.now(),
			models = this.add(instruments.map(options => new InstrumentModel(options)));

		this._socketService.send('instrument:create', instruments, (err, instruments: Array<InstrumentSettings>) => {
			if (err)
				throw err;

			instruments.forEach((instrument, i) => models[i].set({
				id: instrument.id,
				groupId: instrument.groupId,
				status: status
			}));

			this.instruments$.next(this._instruments);
		});

		return models;
	}

	public add(instrumentModels: Array<InstrumentModel>, setFocus = true): Array<InstrumentModel> {

		instrumentModels.forEach(instrumentModel => {

			if (instrumentModel.options.id) {
				let existingModel = this.getById(instrumentModel.options.id);

				if (existingModel) {
					console.warn('Instrument already known! : ' + instrumentModel.options.id);
					return instrumentModel;
				}
			}

			this._instruments.push(instrumentModel);
		});

		if (setFocus && this._instruments.length) {
			this.setFocus(this._instruments[this._instruments.length - 1]);
		}

		this.instruments$.next(this._instruments);

		return instrumentModels
	}

	public fetch(model: InstrumentModel, count, offset = 0, from?: number, until?: number): Promise<any> {

		return new Promise((resolve) => {

			this._socketService.send('instrument:read', {
				id: model.options.id,
				indicators: true,
				offset,
				count,
				from,
				until
			}, (err, data) => {
				if (err)
					return console.error(err);

				model.updateBars(data.candles);
				model.updateIndicators(data.indicators);

				resolve(data);
			});
		});
	}

	public remove(model: InstrumentModel) {
		model.onDestroy();

		this._instruments.splice(this._instruments.indexOf(model), 1);
		this.instruments$.next(this._instruments);

		if (this._instruments.length)
			this.setFocus(this._instruments[this._instruments.length - 1]);

		return this._destroyOnServer(model);
	}

	public removeAll() {
		this._destroyAllOnServer();

		this._instruments = [];
		this.instruments$.next(this._instruments);
	}

	public toggleTimeFrame(model: InstrumentModel, timeFrame) {
		return new Promise((resolve, reject) => {

			this._socketService.send('instrument:toggleTimeFrame', {
				id: model.options.id,
				timeFrame: timeFrame
			}, (err, data) => {
				if (err)
					return reject(err);

				resolve(data);
			});
		});
	}

	public setFocus(model: InstrumentModel) {
		if (model.options.focus === true)
			return;

		this.instruments.forEach(instrument => {
			if (model !== instrument && instrument.options.focus === true)
				instrument.set({focus: false});
		});

		model.set({focus: true});
	}

	public getFocused(): InstrumentModel {
		for (let i = 0, len = this.instruments.length; i < len; i++) {
			if (this.instruments[i].options.focus)
				return this.instruments[i];
		}

		return null;
	}

	public async addIndicator(instrumentModel: InstrumentModel, name: string) {
		return new Promise(async (resolve, reject) => {

			if (!name)
				reject('No indicator name given');

			let indicatorModel = await this._getIndicatorOptions(name),
				options = {};

			if (await this._showIndicatorOptionsMenu(indicatorModel) === false)
				resolve(false);

			// Normalize model values
			forEach(indicatorModel.inputs, input => {

				switch (input.type) {
					case 'number':
						input.value = parseInt(input.value, 10);
						break;
					case 'text':
						input.value = String.prototype.toString.call(input.value);
						break;
				}

				options[input.name] = input.value
			});

			this._socketService.send('instrument:indicator:add', {
				id: instrumentModel.options.id,
				name: indicatorModel.name,
				options: options,
				readCount: 500,
				shift: 0
			}, (err, result) => {
				if (err)
					return reject(err);

				instrumentModel.addIndicator(result);
				// instrumentModel.changed$.next({indicator: {type: 'add', id: result.id}});

				resolve(true);
			});
		});
	}

	public getById(id: string|number): InstrumentModel {
		return this.instruments.find(instrument => instrument.options.id === id);
	}

	public getByGroupId(groupId: string|number): Array<InstrumentModel> {
		return this._instruments.filter(instr => instr.options.groupId === groupId);
	}

	private _showIndicatorOptionsMenu(indicatorModel: IndicatorModel): Promise<boolean> {

		return new Promise((resolve) => {

			let self = this;

			let dialogComponentRef = this._modalService.create(DialogComponent, {
				type: 'dialog',
				title: indicatorModel.name,
				showBackdrop: false,
				showCloseButton: false,
				model: indicatorModel,
				buttons: [
					{value: 'add', text: 'add', type: 'primary'},
					{text: 'cancel', type: 'candel'}
				],
				onClickButton(value) {
					if (value === 'add') {
						self._modalService.destroy(dialogComponentRef);
						resolve(true);
					} else
						self._modalService.destroy(dialogComponentRef);
				}
			});
		});
	}

	private _getIndicatorOptions(name: string): Promise<IndicatorModel> {
		return new Promise((resolve, reject) => {
			this._socketService.send('instrument:indicator:options', {name: name}, (err, data) => {
				err ? reject(err) : resolve(new IndicatorModel(data));
			});
		});
	}

	private _destroyOnServer(model: InstrumentModel) {
		return new Promise((resolve, reject) => {

			this._socketService.send('instrument:destroy', {id: model.options.id}, err => {
				if (err)
					return reject(err);

				resolve();
			});
		});
	}

	private _destroyAllOnServer() {
		return new Promise((resolve, reject) => {

			this._socketService.send('instrument:destroy-all', {}, err => {
				if (err)
					return reject(err);

				resolve();
			});
		});
	}

	private _loadRunningInstruments() {
		this._socketService.send('instrument:list', {}, (err, list: InstrumentSettings[]) => {
			if (err)
				return console.error(err);

			this.add(list.map((instrumentSettings: InstrumentSettings) => new InstrumentModel(instrumentSettings)));
		});
	}
}