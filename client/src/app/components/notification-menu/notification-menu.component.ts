import { ChangeDetectionStrategy, Component, Output, OnDestroy, EventEmitter, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { Router, NavigationStart, NavigationExtras, ActivationEnd } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { UserService } from '../../services/user.service';
import { BehaviorSubject } from 'rxjs';
import { INotification } from 'coinpush/src/interface/notification.interface';
import { AccountService } from '../../services/account/account.service';

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
		private _authenticationSerice: AuthService,
		private _accountService: AccountService
	) {
		
		this._routerEventsSub = this.router.events.subscribe((val) => {
			if (val instanceof ActivationEnd) {
				this.open = !!val.snapshot.queryParams['menu-n'];
				this._changeDetectorRef.detectChanges();
			}
		});
	}

	async ngOnInit() {
		// const notifications = await this.notificationService.findMany().toPromise();
		// this.notifications$.next(notifications);
	}

	public toggleNotificationMenu(state?: boolean) {
		// Show login screen on open
		if ((state === true || typeof state === 'undefined' && !this.open) && !this._accountService.isLoggedIn) {
			this._authenticationSerice.showLoginRegisterPopup();
			return;
		}

		const open = typeof state === 'boolean' ? state : !this.open;
		
		if (open) {
			this.router.navigate([this.router.url], {queryParams: {'menu-n': 1}});
			this.notificationService.resetUnreadCounter();
		}
	}
	
	public onClickMarkAllAsRead(event) {
		event.preventDefault();
		event.stopPropagation();

		this.notifications$.next(this.notifications$.getValue().map(notification => {notification.isRead = true; return notification}));
		this.notificationService.markAllAsRead();
		this._changeDetectorRef.detectChanges();

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