import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { SymbolListService } from "../../services/symbol-list.service";
import { CUSTOM_EVENT_TYPE_ALARM_NEW } from 'coinpush/src/constant';

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

	constructor(
		public symbolListService: SymbolListService,
		private _changeDetectorRef: ChangeDetectorRef
	) {
		// this._changeDetectorRef.detach();
	}

	ngOnInit() {
		this._changeDetectorRef.detectChanges();
	}

	public onDestroyTriggerMenu() {
		this.activeMenu = null;
		this._changeDetectorRef.detectChanges();
	}

	ngOnDestroy() {

		if (this._routeSub)
			this._routeSub.unsubscribe();

		if (this._eventSub)
			this._eventSub.unsubscribe();
	}
}