import { ChangeDetectionStrategy, Component, Input, Output, ChangeDetectorRef, EventEmitter, SimpleChanges, OnChanges, OnDestroy, Pipe, PipeTransform, NgZone } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { UserService } from '../../services/user.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { SymbolModel } from '../../models/symbol.model';
import { EventService } from '../../services/event.service';
import { NgForm } from '@angular/forms';
import { ALARM_TRIGGER_DIRECTION_DOWN, ALARM_TRIGGER_DIRECTION_UP, CUSTOM_EVENT_TYPE_ALARM } from 'coinpush/src/constant';
import { CacheService } from '../../services/cache.service';
import { AuthService } from '../../services/auth/auth.service';
import { EventModel } from '../../models/event.model';
import { SymbolListService } from '../../services/symbol-list.service';
import { DateService } from '../../services/date.service';

import { map } from 'rxjs/operators';
import { AccountService } from '../../services/account/account.service';

@Pipe({ name: 'alarmMenuActiveSymbolEvent' })
export class AlarmMenuActiveSymbolEventPipe implements PipeTransform {
	transform(items: Array<EventModel>, symbolName: string): Array<EventModel> {
		return items.filter(item => item.symbol === symbolName && !item.triggeredDate && !item.removed);
	}
}

@Component({
	selector: 'app-alarm-menu',
	templateUrl: './alarm-menu.component.html',
	styleUrls: ['./alarm-menu.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class AlarmMenuComponent implements OnChanges, OnDestroy {

	@Input() symbol: SymbolModel;
	@Output() inputValueChange: BehaviorSubject<number> = new BehaviorSubject(0);
	@Output() onDestroy: EventEmitter<boolean> = new EventEmitter;

	public historyEvents$;
	public historyEvents;
	public saving: boolean = false;

	public activeTab = 'new';
	public formModel: any = {
		alarmType: "1",
		alarm: {

		},
		amount: 0
	};

	private _mouseDownTimeout = null;
	private _mouseDownSpeedUp = 2;

	private _alarmButtonClickedSubsribtion;

	constructor(
		public eventService: EventService,
		private _symbolListService: SymbolListService,
		private _authenticationService: AuthService,
		private _userService: UserService,
		private _accountService: AccountService,
		private _cacheService: CacheService,
		private _dateService: DateService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _router: Router) {
		// this._changeDetectorRef.detach();
	}

	ngOnInit() {
		// close on route change
		this._router.events.subscribe((val) => {
			if (val instanceof NavigationEnd) {
				this.onDestroy.emit(true);
			}
		})
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.symbol && changes.symbol.currentValue) {
			this._unsubscribe();

			if (this.symbol) {
				this.formModel.amount = parseFloat(this._cacheService.priceToFixed(this._toMinimumDuff(this.symbol.options.bid, 1), this.symbol));

				this.historyEvents$ = this.eventService.findBySymbol(this.symbol.options.name, 0, 50, true);
			}

			this.onChangeInputValue();
			this._changeDetectorRef.detectChanges();
		}
	}

	public onMouseDownNumberInput(event, dir: number): void {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		// ensure touchstart and mousedown don't both trigger
		if (!this._mouseDownTimeout)
			this.updateSideMenuNumberInput(dir, true);
	}

	public onMouseUpNumberInput(event): void {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		clearTimeout(this._mouseDownTimeout);
		this._mouseDownTimeout = null;
	}

	public onChangeInputValue(): void {
		this.inputValueChange.next(this.formModel.amount);
	}

	public onClickRemoveEvent(event): void {
		this.eventService.remove(event);

		this._changeDetectorRef.detectChanges();
	}

	public async onFormSubmit(): Promise<void> {
		if (!this._accountService.isLoggedIn) {
			this._authenticationService.showLoginRegisterPopup();
			return;
		}

		if (!this.symbol)
			return;

		this.toggleSaving(true);

		this.formModel.symbol = this.symbol.options.name;
		this.formModel.type = CUSTOM_EVENT_TYPE_ALARM;
		this.formModel.alarm.dir = this.formModel.amount < this.symbol.options.bid ? ALARM_TRIGGER_DIRECTION_DOWN : ALARM_TRIGGER_DIRECTION_UP;

		try {
			const event = await this.eventService.create(this.formModel);

			// on success - move the alarm cursor x amount
			if (event) {
				const percDiff = (this.formModel.amount / this.symbol.options.bid * 100) - 100;

				if (percDiff > 0) {
					this.formModel.amount += this.symbol.options.bid * 0.008;
				} else {
					this.formModel.amount -= this.symbol.options.bid * 0.008;
				}

				this.formModel.amount = parseFloat(this._cacheService.priceToFixed(this.formModel.amount, this.symbol));
				this.inputValueChange.next(this.formModel.amount);
			}
		} catch (error) {
			console.error(error);
		} finally {
			this.toggleSaving(false);
		}
	}

	public toggleTab(tab: string): void {
		this.activeTab = tab;
		this._changeDetectorRef.detectChanges();
	}

	public getActiveEvents(): Array<EventModel> {
		if (this._symbolListService.activeSymbol) {
			return this.eventService.events$.getValue().filter(event => event.symbol === this._symbolListService.activeSymbol.options.name);
		}

		return [];
	}

	public updateSideMenuNumberInput(dir: number, setRepeat: boolean = false, repeatTime: number = 1000): void {
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

	private _attachEventListeners() {
		
	}

	private _toMinimumDuff(value: number, dir): number {
		if (value < 0)
			return 0;

		const percDiff = (value / this.symbol.options.bid * 100) - 100;

		// if (value >= this.symbol.options.bid && percDiff < 1) {
		// 	return this.symbol.options.bid * (dir > 0 ? 1.01 : 0.99)
		// }

		// if (value < this.symbol.options.bid && percDiff > -1) {
		// 	return this.symbol.options.bid * (dir > 0 ? 1.01 : 0.99)
		// }

		return value;
	}

	private _unsubscribe(): void {
		if (this.historyEvents$ && this.historyEvents$.unsubscribe)
			this.historyEvents$.unsubscribe();
	}

	public toggleSaving(state?: boolean): void {
		this.saving = !!state;
		this._changeDetectorRef.detectChanges();
	}

	ngOnDestroy() {
		this._unsubscribe();
	}
}