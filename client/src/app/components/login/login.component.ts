import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {AuthenticationService} from '../../services/authenticate.service';
import {AlertService} from '../../services/alert.service';

@Component({
	styleUrls: ['./login.component.scss'],
	templateUrl: 'login.component.html'
})

export class LoginComponent implements OnInit {
	model: any = {};
	loading = false;
	returnUrl: string;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private authenticationService: AuthenticationService,
		private alertService: AlertService) { }

	ngOnInit() {
		// reset login status
		this.authenticationService.logout();

		// get return url from route parameters or default to '/'
		this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
	}

	login(e) {
		e.preventDefault();

		this.loading = true;
		this.authenticationService.login(this.model.email, this.model.password)
			.subscribe(
				data => {
					this.router.navigate([this.returnUrl]);
				},
				error => {
					this.alertService.error(error);
					this.loading = false;
				});
	}
}