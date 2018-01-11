import { ChangeDetectionStrategy, Component, OnInit, Output, ViewEncapsulation, ChangeDetectorRef, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
	public isSelf: boolean = true;

	private _routeSub: any;

	@Output() test;

	constructor(
		public userService: UserService,
		private _changeRef: ChangeDetectorRef,
		private _route: ActivatedRoute) {

	}

	ngOnInit() {
		this.user = new UserModel({ _id: this._route.snapshot.params['id'] });

		this._loadUser(this.user.options._id);

		this._routeSub = this._route.params.subscribe(params => {
			// only load if userId is different then current userId
			if (!this.user || !this.user.options || this.user.options._id !== params['id']) {
				this._loadUser(params['id']);
			}
		});
	}

	public async toggleFollow(userModel: UserModel, state: boolean) {
		const result = await this.userService.toggleFollow(userModel, state);
		this._changeRef.detectChanges();
	}

	private async _loadUser(userId: string) {
		// this.user = await this.userService.findById(userId, { followers: 5, copiers: 5 });
		// this.isSelf = userId === this.userService.model.options._id;
		// this._changeRef.detectChanges();
	}

	ngOnDestroy() {
		this._routeSub.unsubscribe();
	}
}