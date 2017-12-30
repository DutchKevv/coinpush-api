import { ChangeDetectionStrategy, Component, OnInit, Input, Output, ChangeDetectorRef, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AlertService } from '../../services/alert.service';
import { UserModel } from '../../models/user.model';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { SymbolModel } from '../../models/symbol.model';
import { EventService } from '../../services/event.service';
import { NgForm } from '@angular/forms';
import { ALARM_TRIGGER_DIRECTION_DOWN, ALARM_TRIGGER_DIRECTION_UP, CUSTOM_EVENT_TYPE_ALARM } from '../../../../../shared/constants/constants';
import { CacheService } from '../../services/cache.service';

@Component({
	selector: 'app-alarm-menu',
	templateUrl: './alarm-menu.component.html',
	styleUrls: ['./alarm-menu.component.scss'],
	// changeDetection: ChangeDetectionStrategy.OnPush
})

export class AlarmMenuComponent implements OnInit, OnChanges {

	@Input() symbol: SymbolModel;
	@Output() onDestroy: EventEmitter<boolean> = new EventEmitter;

	public activeEvents$;
	public historyEvents$;

	public activeTab = 'new';
	public formModel: any = {
		alarmType: "1",
		alarm: {

		}
	};

	constructor(
		public _eventService: EventService,
		private _cacheService: CacheService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _changeRef: ChangeDetectorRef,
		private _route: ActivatedRoute) {
		// this._changeDetectorRef.detach();
	}

	ngAfterViewInit() {
		this._changeDetectorRef.detectChanges();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.symbol && changes.symbol.currentValue) {
			this._unsubscribe();

			if (this.symbol) {
				this.formModel.amount = this.symbol.options.bid;

				this.activeEvents$ = this._eventService.findBySymbol(this.symbol.options.name, 0, 50);
				this.historyEvents$ = this._eventService.findBySymbol(this.symbol.options.name, 0, 50, true);
			}

			this._changeDetectorRef.detectChanges();
		}
	}

	ngOnInit() {
		this.formModel.amount = this.symbol.options.bid;
		this._changeDetectorRef.detectChanges();
	}

	toggleTab(tab: string) {
		this.activeTab = tab;
		this._changeDetectorRef.detectChanges();
	}

	public onCreateFormSubmit(form: NgForm) {
		if (!this.symbol)
			return;

		this.formModel.symbol = this.symbol.options.name;
		this.formModel.type = CUSTOM_EVENT_TYPE_ALARM;
		this.formModel.alarm.dir = this.formModel.amount < this.symbol.options.bid ? ALARM_TRIGGER_DIRECTION_DOWN : ALARM_TRIGGER_DIRECTION_UP;
		this._eventService.create(this.formModel);
	}

	public onClickSideMenuNumberInput(dir: number, inputEl: HTMLElement) {
		let newValue = this.formModel.amount || this.symbol.options.bid;
		let inc = this.symbol.options.bid / 700

		if (dir > 0)
			newValue += inc;
		else
			newValue -= inc;

		this.formModel.amount = parseFloat(this._cacheService.priceToFixed(newValue, this.symbol));
		this._changeDetectorRef.detectChanges();
	}

	private _unsubscribe() {
		if (this.activeEvents$ && this.activeEvents$.unsubscribe)
			this.activeEvents$.unsubscribe();

		if (this.historyEvents$ && this.historyEvents$.unsubscribe)
			this.historyEvents$.unsubscribe();
	}

	ngOnDestroy() {
		this._unsubscribe();
	}
}