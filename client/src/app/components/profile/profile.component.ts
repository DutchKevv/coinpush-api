import {ChangeDetectionStrategy, Component, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Route, Router} from '@angular/router';
import {UserService} from '../../services/user.service';
import {AlertService} from '../../services/alert.service';
import {UserModel} from '../../models/user.model';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from "rxjs/Subject";

@Component({
	selector: 'app-profile',
	templateUrl: './profile.component.html',
	styleUrls: ['./profile.component.scss'],
	// encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileComponent implements OnInit {

	@Output() public user$: BehaviorSubject<UserModel> = new BehaviorSubject(null);

	public userId: string;
	public isSelf: boolean;

	private _sub: any;

	constructor(
				public router: Router,
				public userService: UserService,
				private _route: ActivatedRoute) {
	}

	ngOnInit() {
		this.userId = this._route.snapshot.queryParams['id'];
		this.isSelf = this.userId === this.userService.model.get('_id');

		this.user$.next(new UserModel({
			_id: this.userId
		}));

		this._sub = this._route.params.subscribe(params => {
			
			const type = params['t'];
			this.userId = params['id'];
			this.isSelf = this.userId === this.userService.model.get('_id');

			this.userService.findById(this.userId, {followers: 5, copiers: 5}).subscribe((user: UserModel) => {
				this.user$.next(user);
			});
		});
	}

	ngOnDestroy() {
		this._sub.unsubscribe();
	}
}