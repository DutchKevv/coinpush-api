///<reference path="../../../node_modules/@angular/core/src/metadata/view.d.ts"/>
import {Component, AfterViewInit, Output, OnInit, ElementRef, ViewEncapsulation, ViewChild, ChangeDetectionStrategy} from '@angular/core';
import {SocialService} from '../../services/social.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {AuthenticationService} from '../../services/authenticate.service';
import {Http} from '@angular/http';
import {Subject} from 'rxjs/Subject';
import {CacheService, CacheSymbol} from '../../services/cache.service';

@Component({
	selector: 'page-sub-user',
	template: '<router-outlet></router-outlet>',
	styleUrls: ['./page.sub.user.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.Native
})

export class PageSubUserComponent implements OnInit, AfterViewInit {

	@Output() public searchResults$: Subject<any> = new Subject();
	@ViewChild('input') public input;

	constructor(private _http: Http,
				private _cacheService: CacheService,
				private _authenticationService: AuthenticationService) {
	}

	ngOnInit(): void {
		// attachBackspaceFix(this.input.nativeElement);
	}

	ngAfterViewInit(): void {}

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

		this.searchResults$.next(currentResult);

		this._http.get('/search/' + value, {body: {limit: 5}}).map(res => res.json()).subscribe((result: any) => {
			currentResult.users = JSON.parse(result.users);
			this.searchResults$.next(currentResult);
		});
	}

	public logout(): void {
		this._authenticationService.logout();
	}
}