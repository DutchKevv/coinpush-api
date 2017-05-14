import * as _           from 'lodash';
import {Injectable, Output, EventEmitter} from '@angular/core';
import {InstrumentModel} from '../models/instrument.model';
import {InstrumentSettings} from '../../../shared/interfaces/InstrumentSettings';
import {SocketService} from './socket.service';
import {BehaviorSubject} from 'rxjs';

@Injectable()
export class InstrumentsService {

	@Output() changed = new EventEmitter();

	public instruments$: BehaviorSubject<InstrumentModel[]> = new BehaviorSubject([]);

	private _instruments: InstrumentModel[] = [];
	private _defaults = [{instrument: 'EUR_USD'}, {instrument: 'AUD_CAD'}];

	get instruments() {
		return this._instruments;
	}

	constructor(private _socketService: SocketService) {
		this.init();
	}


	public init(): void {
		this._socketService.socket.on('instrument:created', (instrumentSettings: InstrumentSettings) => {
			this.add(new InstrumentModel(instrumentSettings));
		});

		this._socketService.socket.on('instrument:destroyed', (instrumentSettings: InstrumentSettings) => {
			console.log('dsdfsdafsdf', 'Destroy11');
		});

		this._loadRunningInstruments();
	}

	public create(options: InstrumentSettings): void {
		let model = new InstrumentModel(options);

		this._socketService.socket.emit('instrument:create', {
			instrument: model.data.instrument,
			timeFrame: model.data.timeFrame,
			live: model.data.live
			// start: start
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
		this._instruments.splice(this._instruments.indexOf(model), 1);
		this.instruments$.next(this._instruments);

		if (this.instruments.length) {
			this.setFocus(this.instruments[this.instruments.length - 1]);
		}

		return this._destroyOnServer(model);
	}

	public fetch(model: InstrumentModel, count = 300, offset = 0, from?: number, until?: number): Promise<any> {

		let startTime = Date.now();

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
					alert(err);

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

	private _destroyOnServer(model: InstrumentModel) {
		return new Promise((resolve, reject) => {

			this._socketService.socket.emit('instrument:destroy', {id: model.data.id}, err => {
				if (err)
					return reject(err);


				resolve();
			});
		});
	}

	private _loadRunningInstruments() {
		this._socketService.socket.emit('instrument:chart-list', {}, (err, list: InstrumentSettings[]) => {

			if (err)
				return console.error(err);

			// Show server running instruments
			if (list && list.length)
				list.forEach((instrumentSettings: InstrumentSettings) => this.add(new InstrumentModel(instrumentSettings)));

			// // Load some default instruments
			// // TODO: Should be done by the server
			// else
			//     this._defaults.forEach(instrument => this.create(instrument));
		});
	}
}