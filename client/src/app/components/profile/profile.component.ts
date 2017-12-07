import { ChangeDetectionStrategy, Component, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AlertService } from '../../services/alert.service';
import { UserModel } from '../../models/user.model';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from "rxjs/Subject";

@Component({
	selector: 'app-profile',
	templateUrl: './profile.component.html',
	styleUrls: ['./profile.component.scss'],
	// encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileComponent implements OnInit {

	public user: UserModel = null;
	public isSelf: boolean;

	private _routeSub: any;

	constructor(
		public router: Router,
		private _userService: UserService,
		private _route: ActivatedRoute) {
			
	}

	ngOnInit() {
		this.user = new UserModel({ _id: this._route.snapshot.params['id'] });

		this._loadUser(this.user.options._id);

		this._routeSub = this._route.params.subscribe(params => {
			// only load if userId is different then current userId
			if (!this.user || !this.user.options || this.user.options._id !== params['id'])
				this._loadUser(params['id']);
		});
	}

	private async _loadUser(userId: string) {
		this.user = await this._userService.findById(userId, { followers: 5, copiers: 5 });
		this.isSelf = userId === this._userService.model.options._id;
	}

	ngOnDestroy() {
		this._routeSub.unsubscribe();
	}
}