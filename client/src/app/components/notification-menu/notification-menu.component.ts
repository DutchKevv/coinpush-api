import { ChangeDetectionStrategy, Component, Output, OnDestroy, EventEmitter, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { Router, NavigationStart } from '@angular/router';
import { AuthenticationService } from '../../services/authenticate.service';
import { UserService } from '../../services/user.service';
import { BehaviorSubject } from 'rxjs';
import { INotification } from 'coinpush/interface/notification.interface';

@Component({
	selector: 'app-notification-menu',
	templateUrl: './notification-menu.component.html',
	styleUrls: ['./notification-menu.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class NotificationMenuComponent implements OnDestroy, OnInit {

	@Output() public open: boolean = false;
	public notifications$ = new BehaviorSubject([]);
	public showNoNotifications$ = new BehaviorSubject(false);

	private _routerEventsSub;

	/**
	 * outside click for searchdropdown
	 * @param event 
	 */
	@HostListener('window:click', ['$event'])
	onWindowClick(event) {
		if (!event.target.classList.contains('globe-container') && 
			event.target.parentNode && !event.target.parentNode.classList.contains('globe-container')) {
			this.toggleNotificationMenu(false);
			this._changeDetectorRef.detectChanges();
		}
	}

	constructor(
		public notificationService: NotificationService,
		public router: Router,
		private _changeDetectorRef: ChangeDetectorRef,
		private _authenticationSerice: AuthenticationService,
		private _userService: UserService
	) {
		
		this._routerEventsSub = this.router.events.subscribe((val) => {
			if (val instanceof NavigationStart)
				this.open = false;
		});
	}

	async ngOnInit() {
		const notifications = await this.notificationService.findMany().toPromise();
		this.notifications$.next(notifications);
	}

	public toggleNotificationMenu(state?: boolean) {
		// Show login screen on open
		if ((state === true || typeof state === 'undefined' && !this.open) && !this._userService.model.options._id) {
			this._authenticationSerice.showLoginRegisterPopup();
			return;
		}

		this.open = typeof state === 'boolean' ? state : !this.open;

		// reset counter when user opens menu
		if (this.open) {
			this.notificationService.resetUnreadCounter();
		}
	}
	
	public onClickMarkAllAsRead(event) {
		event.preventDefault();
		event.stopPropagation();

		this.notifications$.getValue().forEach(notification => notification.isRead = true);
		this.notificationService.markAllAsRead();

	}

	public onClickNotification(event, notification: INotification) {
		this.open = false;

		if (!notification.isRead)
			this.notificationService.markAsRead(notification);
	}

	ngOnDestroy() {
		this.notifications$.unsubscribe();
	}
}