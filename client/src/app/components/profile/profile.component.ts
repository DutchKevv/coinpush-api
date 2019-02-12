import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, ApplicationRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserModel } from '../../models/user.model';
import { AccountService } from '../../services/account/account.service';

@Component({
	selector: 'app-profile',
	templateUrl: './profile.component.html',
	styleUrls: ['./profile.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileComponent implements OnInit {

	public user: UserModel = null;
	public isSelf: boolean = true;

	private _routeSub: any;
	private _onScrollBinded = null;
	private _lastScrollPos = 0;

	@ViewChild('header') header;

	constructor(
		private userService: UserService,
		public elementRef: ElementRef,
		private _accountService: AccountService,
		private _applicationRef: ApplicationRef,
		private _changeRef: ChangeDetectorRef,
		private _route: ActivatedRoute) {
		this._onScrollBinded = this._onScroll.bind(this);
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

		this._bindScroll();
	}

	public async toggleFollow(userModel: UserModel, state: boolean) {
		const result = await this.userService.toggleFollow(userModel, state);
		this._changeRef.detectChanges();
	}

	private async _loadUser(userId: string) {
		this.user = await this.userService.findById(userId, { followers: 5 }).toPromise();
		this.isSelf = userId === this._accountService.account$.getValue()._id;

		this._updateHeaderTitle(this.user.options.name);

		this._changeRef.detectChanges();
	}

	private _bindScroll() {
		this.elementRef.nativeElement.addEventListener('scroll', this._onScrollBinded, { passive: true });
	}

	private _unbindScroll() {
		this.elementRef.nativeElement.removeEventListener('scroll', this._onScrollBinded, { passive: true });
	}

	private _onScroll(event) {
		let offset, scrollOffset = event.target.scrollTop;
		const isDirUp = this._lastScrollPos > scrollOffset;
		this._lastScrollPos = scrollOffset;

		if (!isDirUp && scrollOffset < 100)
			return;

		scrollOffset = -(scrollOffset - 100);

		if (scrollOffset < -200)
			scrollOffset = -200;
		else if (scrollOffset > 0)
			scrollOffset = 0;

		this.header.nativeElement.style.transform = 'translateY(' + scrollOffset + 'px)';
	}

	private _updateHeaderTitle(title?: string) {
		this._applicationRef.components[0].instance.titleText$.next(title || '');
	}

	ngOnDestroy() {
		if (this._routeSub)
			this._routeSub.unsubscribe();

		this._unbindScroll();

		this._updateHeaderTitle('');
	}
}