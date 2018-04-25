import {Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {AuthenticationService} from '../../services/authenticate.service';
import {AlertService} from '../../services/alert.service';

@Component({
	styleUrls: ['./password-reset.component.scss'],
	templateUrl: 'password-reset.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
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

	
}