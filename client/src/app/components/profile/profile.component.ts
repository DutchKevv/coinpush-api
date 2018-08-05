import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, ContentChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserModel } from '../../models/user.model';
import { SocialFeedComponent } from '../social-feed/social.feed.component';

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
	private _onScrollBinded = null;
	
	@ViewChild('header') header;
	@ContentChild(SocialFeedComponent) socialFeedComponent;

	constructor(
		public userService: UserService,
		private _elementRef: ElementRef,
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

		const interval = setInterval(() => {
			const el = this._elementRef.nativeElement.querySelector('app-social-feed');
			if (el) {
				clearInterval(interval);
				this._bindScroll(el.querySelector('.feed-container'));
			}
		}, 100);
	}

	public async toggleFollow(userModel: UserModel, state: boolean) {
		const result = await this.userService.toggleFollow(userModel, state);
		this._changeRef.detectChanges();
	}

	private async _loadUser(userId: string) {
		this.user = await this.userService.findById(userId, { followers: 5}).toPromise();
		this.isSelf = userId === this.userService.model.options._id;
		this._changeRef.detectChanges();
	}

	private _bindScroll(el) {
		el.addEventListener('scroll', this._onScrollBinded, {passive: true});
	}

	private _unbindScroll() {
		// this.socialFeedComponent.nativeElement.removeEventListener('scroll', this._onScrollBinded, {passive: true});
	}

	private _onScroll(event) {
		let offset = (event.target.scrollTop);

		if (offset > 100)
			offset = 100;

		this.header.nativeElement.style.transform = 'translateY(' + -offset + 'px)';
	}

	ngOnDestroy() {
		if (this._routeSub)
			this._routeSub.unsubscribe();

		this._unbindScroll();
	}
}