import {Component, AfterViewInit, Output, OnInit, ElementRef} from '@angular/core';
import {SocialService} from '../../services/social.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {AuthenticationService} from '../../services/authenticate.service';

@Component({
	selector: 'page-main',
	templateUrl: './page.main.component.html',
	styleUrls: ['./page.main.component.scss']
})

export class PageMainComponent implements OnInit, AfterViewInit {

	@Output() public tradersList$: BehaviorSubject<[]> = new BehaviorSubject([]);
	@Output() public activeTab$: BehaviorSubject<string> = new BehaviorSubject('watchlist');

	constructor(private _authenticationService: AuthenticationService,
				private _elementRef: ElementRef,
				public socialService: SocialService) {
	}

	ngOnInit(): void {
		this.socialService.getList().then(list => {
			this.tradersList$.next(list);
		});
	}

	ngAfterViewInit(): void {
	}

	logout() {
		this._authenticationService.logout();
	}

	toggleTab(tab: string) {
		this.activeTab$.next(tab);
	}
}