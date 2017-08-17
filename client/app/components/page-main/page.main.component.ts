import {Component, AfterViewInit, Output, OnInit, ElementRef, ViewEncapsulation, ViewChild} from '@angular/core';
import {SocialService} from '../../services/social.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {AuthenticationService} from '../../services/authenticate.service';
import {Http} from '@angular/http';
import {Subject} from 'rxjs/Subject';
import {CacheService, CacheSymbol} from '../../services/cache.service';
import {UserService} from '../../services/user.service';

@Component({
	selector: 'page-main',
	templateUrl: './page.main.component.html',
	styleUrls: ['./page.main.component.scss']
	// encapsulation: ViewEncapsulation.Native
})

export class PageMainComponent implements OnInit, AfterViewInit {

	@Output() public searchResults$: Subject<any> = new Subject();
	@ViewChild('input') public input;
	@ViewChild('dropdown') public dropdown;

	constructor(public userService: UserService,
				private _http: Http,
				private _cacheService: CacheService,
				private _authenticationService: AuthenticationService) {
	}

	ngOnInit(): void {
		// attachBackspaceFix(this.input.nativeElement);
	}

	ngAfterViewInit(): void {
	}

	public onSearchKeyUp(event): void {
		const value = event.target.value.trim();

		if (!value.length) {
			this.searchResults$.next();
			return;
		}

		const symbols = this._cacheService.getByText(value).map((symbol: CacheSymbol) => ({
			name: symbol.options.name
		})).slice(0, 5);

		const currentResult = {
			users: [],
			symbols: symbols,
			channels: []
		};

		this.toggleDropdownVisibility(true);
		this.searchResults$.next(currentResult);

		this._http.get('/search/' + value, {params: {limit: 5}}).map(res => res.json()).subscribe((result: any) => {
			currentResult.users = JSON.parse(result.users);
			this.searchResults$.next(currentResult);
		});
	}

	public onClickDropdownItem() {
		this.toggleDropdownVisibility(false);
	}

	public toggleDropdownVisibility(state) {
		if (this.dropdown) {
			requestAnimationFrame(() => {
				this.dropdown.nativeElement.classList.toggle('hidden', !state)
			})
		}
	}

	public logout(): void {
		this._authenticationService.logout();
	}
}