import {Component, ChangeDetectionStrategy, ViewEncapsulation, AfterViewInit, OnInit, Output} from '@angular/core';
import {AuthenticationService} from "./services/authenticate.service";
import {SocketService} from "./services/socket.service";
import {CacheService} from "./services/cache.service";
import {OrderService} from "./services/order.service";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Subject} from "rxjs/Subject";

declare let Module: any;

@Component({
	selector: 'app',
	template: `
		<div modalAnchor></div>
		<app-alert></app-alert>
		<router-outlet></router-outlet>
	`,
	styleUrls: [
		'./app.component.scss',
		'../../node_modules/font-awesome/css/font-awesome.css'
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None
})

export class AppComponent implements OnInit {

	@Output() public ready$: Subject<boolean> = new Subject();

	constructor(public authenticationService: AuthenticationService) {}

	ngOnInit() {
		this.authenticationService.authenticate();
	}
}