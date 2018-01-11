import { ChangeDetectionStrategy, Component, Input, Output, ChangeDetectorRef, EventEmitter, SimpleChanges, OnChanges, OnDestroy } from '@angular/core';
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
import { AuthenticationService } from '../../services/authenticate.service';

@Component({
	selector: 'app-alarm-menu',
	templateUrl: './alarm-menu.component.html',
	styleUrls: ['./alarm-menu.component.scss'],
	// changeDetection: ChangeDetectionStrategy.OnPush
})

export class AlarmMenuComponent implements OnChanges, OnDestroy {

	@Input() symbol: SymbolModel;
	@Output() inputValueChange: BehaviorSubject<number> = new BehaviorSubject(null);
	@Output() onDestroy: EventEmitter<boolean> = new EventEmitter;

	public activeEvents$;
	public historyEvents$;

	public activeTab = 'new';
	public formModel: any = {
		alarmType: "1",
		alarm: {

		}
	};

	private _mouseDownTimeout = null;
	private _mouseDownSpeedUp = 2;
	
	constructor(
		public _eventService: EventService,
		private _authenticationService: AuthenticationService,
		private _userService: UserService,
		private _cacheService: CacheService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _changeRef: ChangeDetectorRef,
		private _route: ActivatedRoute) {
		// this._changeDetectorRef.detach();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.symbol && changes.symbol.currentValue) {
			this._unsubscribe();

			if (this.symbol) {
				this.formModel.amount = parseFloat(this._cacheService.priceToFixed(this._toMinimumDuff(this.symbol.options.bid, 1), this.symbol));

				this.activeEvents$ = this._eventService.findBySymbol(this.symbol.options.name, 0, 50);
				this.historyEvents$ = this._eventService.findBySymbol(this.symbol.options.name, 0, 50, true);
			}

			this.onChangeInputValue();
			this._changeDetectorRef.detectChanges();
		}
	}

	public onMouseDownNumberInput(event, dir: number) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		// ensure touchstart and mousedown don't both trigger
		if (!this._mouseDownTimeout)
			this.updateSideMenuNumberInput(dir, true);
	}

	public onMouseUpNumberInput(event) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		clearTimeout(this._mouseDownTimeout);
		this._mouseDownTimeout = null;
	}

	public onChangeInputValue() {
		this.inputValueChange.next(this.formModel.amount);
	}

	toggleTab(tab: string) {
		this.activeTab = tab;
		this._changeDetectorRef.detectChanges();
	}

	public onFormSubmit() {
		if (!this._userService.model.options._id) {
			this._authenticationService.showLoginRegisterPopup();
			return;
		}
			
		if (!this.symbol)
			return;

		this.formModel.symbol = this.symbol.options.name;
		this.formModel.type = CUSTOM_EVENT_TYPE_ALARM;
		this.formModel.alarm.dir = this.formModel.amount < this.symbol.options.bid ? ALARM_TRIGGER_DIRECTION_DOWN : ALARM_TRIGGER_DIRECTION_UP;
		this._eventService.create(this.formModel);
	}

	public updateSideMenuNumberInput(dir: number, setRepeat: boolean = false, repeatTime: number = 1000) {
		clearTimeout(this._mouseDownTimeout);
		this._mouseDownTimeout = null;

		let newValue = this.formModel.amount || this.symbol.options.bid;
		let inc = this.symbol.options.bid / 800

		if (dir > 0)
			newValue += inc;
		else
			newValue -= inc;

		newValue = this._toMinimumDuff(newValue, dir);

		this.formModel.amount = parseFloat(this._cacheService.priceToFixed(newValue, this.symbol));
		this.inputValueChange.next(this.formModel.amount);
		this._changeDetectorRef.detectChanges();

		if (setRepeat) {
			repeatTime = repeatTime / this._mouseDownSpeedUp;
			this._mouseDownTimeout = setTimeout(() => this.updateSideMenuNumberInput(dir, true, repeatTime), repeatTime);
		}
	}

	private _toMinimumDuff(value: number, dir): number {
		const percDiff = (value / this.symbol.options.bid * 100) - 100;

		if (value >= this.symbol.options.bid && percDiff < 1) {
			return this.symbol.options.bid * (dir > 0 ? 1.01 : 0.99)
		}

		if (value < this.symbol.options.bid && percDiff > -1) {
			return this.symbol.options.bid * (dir > 0 ? 1.01 : 0.99)
		}

		return value;
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