import {Component, AfterViewInit, Output, OnInit, ElementRef, ViewEncapsulation, ViewChild} from '@angular/core';
import {AuthenticationService} from '../../services/authenticate.service';
import {Http} from '@angular/http';
import {Subject} from 'rxjs/Subject';
import {CacheService} from '../../services/cache.service';
import {UserService} from '../../services/user.service';
import {SymbolModel} from "../../models/symbol.model";
import { TypescriptCompilerService } from '../../services/typescript.compiler.service';

@Component({
	selector: 'page-main',
	templateUrl: './page.main.component.html',
	styleUrls: ['./page.main.component.scss']
	// encapsulation: ViewEncapsulation.Native
})

export class PageMainComponent {

	@Output() public searchResults$: Subject<any> = new Subject();
	@ViewChild('input') public input;
	@ViewChild('dropdown') public dropdown;

	constructor(public userService: UserService,
				private _http: Http,
				private _cacheService: CacheService,
				private _authenticationService: AuthenticationService) {

	}

	public onSearchKeyUp(event): void {
		const value = event.target.value.trim();

		if (!value.length) {
			this.searchResults$.next();
			return;
		}

		const symbols = this._cacheService.getByText(value).slice(0, 5).map((symbol: SymbolModel) => ({
			name: symbol.options.name
		}));

		const currentResult = {
			users: [],
			symbols: symbols,
			channels: []
		};

		this.toggleDropdownVisibility(true);
		this.searchResults$.next(currentResult);

		this._http.get('/search/', {params: {limit: 5, text: value}}).map(res => res.json()).subscribe((result: any) => {
			currentResult.users = result.users;
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