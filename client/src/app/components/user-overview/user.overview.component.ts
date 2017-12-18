import { debounce } from 'lodash';
import {
	Component, OnInit, OnDestroy, ChangeDetectionStrategy,
	AfterViewChecked, ViewEncapsulation, Output
} from '@angular/core';
import { UserService } from '../../services/user.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { UserModel } from '../../models/user.model';
import countries from '../../../../../shared/data/countries';
import { CacheService } from '../../services/cache.service';

declare let $: any;

const shuffleArray = (arr) => arr.sort(() => (Math.random() - 0.5));

@Component({
	selector: 'app-user-overview',
	templateUrl: './user.overview.component.html',
	styleUrls: ['./user.overview.component.scss'],
	// encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class UserOverviewComponent implements OnInit, OnDestroy, AfterViewChecked {

	@Output() public newest$: BehaviorSubject<any[]> = new BehaviorSubject([]);
	@Output() public editorChoice$: BehaviorSubject<any[]> = new BehaviorSubject([]);
	@Output() public topInvestors$: BehaviorSubject<any[]> = new BehaviorSubject([]);

	public countries: any[] = countries;
	public symbols: any[] = this._cacheService.symbols;

	public selfId = this.userService.model.options._id;

	private _moveInterval;

	constructor(
		public userService: UserService,
		private _cacheService: CacheService) {
	}

	ngOnInit() {
		this.userService.getOverview().subscribe((users: Array<UserModel>) => {
			this.newest$.next(users.slice());
			this.editorChoice$.next(users.slice().reverse());
			this.topInvestors$.next(shuffleArray(users.slice()));
		});
	}

	ngAfterViewChecked() {
		this.setMoveInterval();
	}

	onChangeCountry(countryCode: string) {
		alert(countryCode);
	}

	setMoveInterval() {
		this._moveInterval = setInterval(() => this.moveCards());
	}

	clearMoveInterval() {
		clearInterval(this._moveInterval);
	}

	moveCards() {

	}

	ngOnDestroy() {
		$(window).off('resize.debugger');
	}
}
