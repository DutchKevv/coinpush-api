import {CookieService} from 'ngx-cookie';
import {debounce} from 'lodash';
import {
	Component, ElementRef, OnInit, OnDestroy, ChangeDetectionStrategy, NgZone,
	AfterViewChecked, ViewEncapsulation, Output
} from '@angular/core';
import {InstrumentsService} from '../../services/instruments.service';
import {UserService} from '../../services/user.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {TradingChannelService} from '../../services/trading.channel.service';
import {OrderService} from '../../services/order.service';
import {ConstantsService} from '../../services/constants.service';
import {CacheService} from '../../services/cache.service';
import {OrderModel} from '../../../../shared/models/OrderModel';

declare let $: any;

@Component({
	selector: 'app-portfolio',
	templateUrl: './portfolio.component.html',
	styleUrls: ['./portfolio.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class PortfolioComponent implements OnInit, OnDestroy, AfterViewChecked {

	@Output() public orders$: BehaviorSubject<[]> = new BehaviorSubject([]);

	constructor(public constantsService: ConstantsService,
				public cacheService: CacheService,
				private _orderService: OrderService) {
	}

	ngOnInit() {
		this.getList();
	}

	getList() {
		this.orders$.getValue().forEach((order: OrderModel) => OrderModel.destroy());

		this._orderService.getList().subscribe((list) => {
			// Wait until cache is ready
			this.orders$.next(list);
		});
	}

	ngAfterViewChecked() {
		// console.log('FOOTER FOOTER CHECK!!');
	}

	ngOnDestroy() {

	}
}