import {ChangeDetectionStrategy, Component, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from '../../services/user.service';
import {AlertService} from '../../services/alert.service';
import {UserModel} from '../../models/user.model';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Component({
	selector: 'app-profile',
	templateUrl: './profile.component.html',
	styleUrls: ['./profile.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileComponent implements OnInit {

	@Output() public user$: BehaviorSubject<[]> = new BehaviorSubject(new UserModel());
	loading = false;

	private _id: number;
	private _sub: any;

	constructor(
		private _route: ActivatedRoute,
		private _userService: UserService,
		private alertService: AlertService) { }

	ngOnInit() {
		console.log(this._route.paramMap);
		this._sub = this._route.params.subscribe(params => {
			this._id = params['id']; // (+) converts string 'id' to a number

			this._userService.get(this._id).subscribe((user: UserModel) => {
				this.user$.next(user.options);
			});
			// In a real app: dispatch action to load the details here.
		});
	}

	register() {
		this.loading = true;
		this.userService.get(this.model.options._id)
			.subscribe(
				data => {
					console.log(data);
				},
				error => {
					console.log(error);
				});
	}
}