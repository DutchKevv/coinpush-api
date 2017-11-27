import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {AuthenticationService} from '../../services/authenticate.service';
import {AlertService} from '../../services/alert.service';

@Component({
	styleUrls: ['./password-reset.component.scss'],
	templateUrl: 'password-reset.component.html',
	// encapsulation: ViewEncapsulation.Native
})

export class PasswordResetComponent implements OnInit {

	model: {
		password: string;
		passwordConf: string;
	} = {password: '', passwordConf: ''};

	loading: boolean = false;

	constructor(private route: ActivatedRoute,
				private router: Router,
				private authenticationService: AuthenticationService,
				private alertService: AlertService) {}

	ngOnInit() {
		// get return url from route parameters or default to '/'

	}

	async resetPassword(e) {
		e.preventDefault();

		this.loading = true;

		const token = this.route.snapshot.queryParams['token'];
		const result = await this.authenticationService.updatePassword(token, this.model.password);

		if (result)
			return this.router.navigate(['/login']);

		this.alertService.error('Invalid username / password');
		this.loading = false;
	}
}