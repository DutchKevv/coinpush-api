import * as _           from 'lodash';
import {Injectable, Output, EventEmitter} from '@angular/core';
import {InstrumentModel} from '../models/instrument.model';
import {InstrumentSettings} from '../../../shared/interfaces/InstrumentSettings';
import {SocketService} from './socket.service';
import {BehaviorSubject} from 'rxjs';
import {SystemState} from '../../../shared/models/SystemState';
import {IndicatorModel} from "../models/indicator";
import {DialogComponent} from "../common/dialog/dialog.component";
import {ModalService} from "./modal.service";

var counter = 0;

@Injectable()
export class InstrumentsService {

	@Output() changed = new EventEmitter();

	public instruments$: BehaviorSubject<InstrumentModel[]> = new BehaviorSubject([]);
	public instrumentList$: BehaviorSubject<any> = new BehaviorSubject([]);

	private _instruments: InstrumentModel[] = [];

	get instruments() {
		return this._instruments;
	}

	constructor(private _modalService: ModalService,
				private _socketService: SocketService) {
		this.init();
	}

	public init(): void {
		this._socketService.socket.on('instrument:created', (instrumentSettings: InstrumentSettings) => {
			this.add(new InstrumentModel(instrumentSettings));
		});

		this._socketService.socket.on('instrument:destroyed', (instrumentSettings: InstrumentSettings) => {
			console.log('dsdfsdafsdf', 'Destroy11');
		});

		this._socketService.socket.on('system:state', (systemState: SystemState) => {
			if (!systemState.booting && systemState.connected) {
				this._loadInstrumentList();
				this._loadRunningInstruments();
			}
		});
	}

	public create(options: InstrumentSettings): void {
		let model = new InstrumentModel(options);

		this._socketService.socket.emit('instrument:create', {
			instrument: model.data.instrument,
			timeFrame: model.data.timeFrame,
			live: model.data.live
		});
	}

	public add(instrumentModel: InstrumentModel): void {
		let existingModel = _.find(this._instruments, (instrument) => instrument.data.id === instrumentModel.data.id);

		if (existingModel) {

		} else {
			this._instruments.push(instrumentModel);
			this.instruments$.next(this._instruments);
		}

		this.setFocus(instrumentModel);
	}

	public remove(model: InstrumentModel) {
		console.log(counter++);

		this._instruments.splice(this._instruments.indexOf(model), 1);
		this.instruments$.next(this._instruments);

		if (this.instruments.length) {
			this.setFocus(this.instruments[this.instruments.length - 1]);
		}

		return this._destroyOnServer(model);
	}

	public removeAll() {
		this._destroyAllOnServer();

		this._instruments = [];
		this.instruments$.next(this._instruments);
	}

	public fetch(model: InstrumentModel, count = 300, offset = 0, from?: number, until?: number): Promise<any> {

		return new Promise((resolve) => {

			this._socketService.socket.emit('instrument:read', {
				id: model.data.id,
				indicators: true,
				offset,
				count,
				until,
				from
			}, (err, data) => {
				if (err)
					return console.error(err);

				model.updateBars(data.candles);
				model.updateIndicators(data.indicators);

				resolve(data);
			});
		});
	}

	public toggleTimeFrame(model: InstrumentModel, timeFrame) {
		return new Promise((resolve, reject) => {

			this._socketService.socket.emit('instrument:toggleTimeFrame', {
				id: model.data.id,
				timeFrame: timeFrame
			}, (err, data) => {
				if (err)
					return reject(err);

				resolve(data);
			});
		});
	}

	public setFocus(model: InstrumentModel) {
		if (model.data.focus === true)
			return;

		this.instruments.forEach(instrument => {
			instrument.set({focus: false});
		});

		model.set({focus: true});
	}

	public getFocused(): InstrumentModel {
		for (let i = 0, len = this.instruments.length; i < len; i++) {
			if (this.instruments[i].data.focus)
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
			_.forEach(indicatorModel.inputs, input => {

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

			this._socketService.socket.emit('instrument:indicator:add', {
				id: instrumentModel.data.id,
				name: indicatorModel.name,
				options: options,
				readCount: 500,
				shift: 0
			}, (err, result) => {
				if (err)
					return reject(err);

				instrumentModel.addIndicator(result);
				instrumentModel.changed.next({indicator: {type: 'add', id: result.id}});

				resolve(true);
			});
		});
	}

	public findById(id) {
		return this.instruments.find(instrument => instrument.data.id === id);
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
			this._socketService.socket.emit('instrument:indicator:options', {name: name}, (err, data) => {
				err ? reject(err) : resolve(new IndicatorModel(data));
			});
		});
	}

	private _destroyOnServer(model: InstrumentModel) {
		return new Promise((resolve, reject) => {

			this._socketService.socket.emit('instrument:destroy', {id: model.data.id}, err => {
				if (err)
					return reject(err);

				resolve();
			});
		});
	}

	private _destroyAllOnServer() {
		return new Promise((resolve, reject) => {

			this._socketService.socket.emit('instrument:destroy-all', {}, err => {
				if (err)
					return reject(err);

				resolve();
			});
		});
	}

	private _loadInstrumentList() {
		this._socketService.socket.emit('instrument:list', {}, (err, instrumentList) => {
			if (err)
				return console.error(err);


			this.instrumentList$.next(instrumentList.map(instrument => instrument.instrument));
		});
	}

	private _loadRunningInstruments() {
		this._socketService.socket.emit('instrument:chart-list', {}, (err, list: InstrumentSettings[]) => {

			if (err)
				return console.error(err);

			// Show server running instruments
			if (list && list.length)
				list.forEach((instrumentSettings: InstrumentSettings) => this.add(new InstrumentModel(instrumentSettings)));
		});
	}
}