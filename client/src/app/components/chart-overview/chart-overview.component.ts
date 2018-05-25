import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { EventService } from "../../services/event.service";
import { SymbolModel } from "../../models/symbol.model";
import { SymbolListService } from "../../services/symbol-list.service";
import { CUSTOM_EVENT_TYPE_ALARM_NEW } from 'coinpush/constant';

const DEFAULT_FILTER_POPULAR_LENGTH = 40;

@Component({
	selector: 'chart-overview',
	templateUrl: './chart-overview.component.html',
	styleUrls: ['./chart-overview.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ChartOverviewComponent implements OnInit, OnDestroy {

	public CUSTOM_EVENT_TYPE_ALARM_NEW = CUSTOM_EVENT_TYPE_ALARM_NEW;

	public activeMenu: string = null;

	private _routeSub;
	private _eventSub;
	private _destroyed = false;

	constructor(
		public symbolListService: SymbolListService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _eventService: EventService
	) {
		// this._changeDetectorRef.detach();
	}

	ngOnInit() {
		// this._eventSub = this._eventService.events$.subscribe(() => this._changeDetectorRef.detectChanges());
		this._changeDetectorRef.detectChanges();
	}

	public onDestroyTriggerMenu() {
		this.activeMenu = null;
		this._changeDetectorRef.detectChanges();
	}

	ngOnDestroy() {
		this._destroyed = true;

		if (this._routeSub)
			this._routeSub.unsubscribe();

		if (this._eventSub)
			this._eventSub.unsubscribe();
	}
}