import { Component, ChangeDetectionStrategy, EventEmitter, Output, ViewChild, ElementRef, HostListener, OnInit } from "@angular/core";
import { environment } from "../../../environments/environment";
import { UserService } from "../../services/user.service";
import { AuthService } from "../../services/auth/auth.service";
import { AccountService } from "../../services/account/account.service";

@Component({
	selector: 'app-navigation-menu',
	styleUrls: ['./navigation-menu.component.scss'],
	templateUrl: 'navigation-menu.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class NavigationMenuComponent implements OnInit {

	public state: boolean = false;
	public version = 'v0.0.2-' + (environment.production ? 'prod' : 'dev');

	constructor(
		public accountService: AccountService,
		public authenticationService: AuthService) {
	}

	ngOnInit() {
		
	}
}