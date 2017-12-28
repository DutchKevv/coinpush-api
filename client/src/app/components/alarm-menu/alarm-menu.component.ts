import { ChangeDetectionStrategy, Component, OnInit, Input, Output, ChangeDetectorRef, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AlertService } from '../../services/alert.service';
import { UserModel } from '../../models/user.model';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { SymbolModel } from '../../models/symbol.model';
import { EventService } from '../../services/event.service';
import { NgForm } from '@angular/forms';
import { ALARM_TRIGGER_DIRECTION_DOWN, ALARM_TRIGGER_DIRECTION_UP, CUSTOM_EVENT_TYPE_ALARM } from '../../../../../shared/constants/constants';

@Component({
	selector: 'app-alarm-menu',
	templateUrl: './alarm-menu.component.html',
	styleUrls: ['./alarm-menu.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class AlarmMenuComponent implements OnInit {

	@Input() symbol: SymbolModel;
	@Output() onDestroy: EventEmitter<boolean> = new EventEmitter;

	public activeMenu = null;
	public activeAlarmMenu = 'new';
	public formModel: any = {
		alarmType: "1",
		alarm: {

		}
	};

	constructor(
		private _eventService: EventService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _changeRef: ChangeDetectorRef,
		private _route: ActivatedRoute) {}

	ngOnInit() {
		
	}

	toggleAlarmMenuVisibility() {
		if (this.activeMenu === 'alarm') {
			this.activeMenu = this.activeAlarmMenu = null;
		} else {
			this.activeMenu = 'alarm';
			this.activeAlarmMenu = 'new'
		}
		this._changeDetectorRef.detectChanges();
	}

	toggleAlarmMenuTab(tab: string) {
		this.activeAlarmMenu = tab;
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

		// this.formModel.amount = parseFloat(this._priceToFixed(newValue));
		// this._changeDetectorRef.detectChanges();
	}

	ngOnDestroy() {
	
	}
}