// import { debounce } from 'lodash';
import {
	Component, OnInit, OnDestroy, ChangeDetectionStrategy, Output, ChangeDetectorRef
} from '@angular/core';
import { UserService } from '../../services/user.service';
import { BehaviorSubject } from 'rxjs';
import { UserModel } from '../../models/user.model';
import { CacheService } from '../../services/cache.service';
import { AccountService } from '../../services/account/account.service';

const shuffleArray = (arr) => arr.sort(() => (Math.random() - 0.5));

@Component({
	selector: 'app-user-overview',
	templateUrl: './user.overview.component.html',
	styleUrls: ['./user.overview.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class UserOverviewComponent implements OnInit, OnDestroy {

	@Output() public newest$: BehaviorSubject<any[]> = new BehaviorSubject([]);
	@Output() public editorChoice$: BehaviorSubject<any[]> = new BehaviorSubject([]);
	@Output() public topInvestors$: BehaviorSubject<any[]> = new BehaviorSubject([]);

	public countries: any[] = window['countries'];
	public symbols: any[] = this._cacheService.symbols;

	public selfId = this._accountService.account$.getValue()._id;

	constructor(
		private _userService: UserService,
		private _accountService: AccountService,
		private _cacheService: CacheService,
		private _changeDetectorRef: ChangeDetectorRef) {
	}

	async ngOnInit() {
		const users = <any>await this._userService.getOverview();

		this.newest$.next(users.slice());
		this.editorChoice$.next(users.slice().reverse());
		this.topInvestors$.next(shuffleArray(users.slice()));
	}

	public async toggleFollow(model: UserModel, state: boolean) {
		await this._userService.toggleFollow(model, state);
		this._changeDetectorRef.detectChanges();
	}

	onChangeCountry(countryCode: string) {
		alert(countryCode);
	}

	moveCards() {

	}

	ngOnDestroy() {
	}
}
