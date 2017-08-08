import {Component, AfterViewInit, Output, OnInit, ElementRef} from '@angular/core';
import {SocialService} from '../../services/social.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {AuthenticationService} from '../../services/authenticate.service';
import {Http} from '@angular/http';
import {Subject} from 'rxjs/Subject';

@Component({
	selector: 'page-main',
	templateUrl: './page.main.component.html',
	styleUrls: ['./page.main.component.scss']
})

export class PageMainComponent implements OnInit, AfterViewInit {

	@Output() public searchResults$: Subject<any> = new Subject();

	constructor(private _http: Http,
				private _authenticationService: AuthenticationService) {
	}

	ngOnInit(): void {

	}

	ngAfterViewInit(): void {}

	public onSearchKeyUp(event): void {
		const value = event.target.value.trim();

		this._http.get('/search/' + value).map(res => res.json()).subscribe((result: any) => {
			console.log(result);
			result.users = JSON.parse(result.users);
			this.searchResults$.next(result);
		});
	}

	public logout(): void {
		this._authenticationService.logout();
	}
}