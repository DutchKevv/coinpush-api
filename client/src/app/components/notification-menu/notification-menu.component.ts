import { ChangeDetectionStrategy, Component, Output, OnDestroy } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { Router, NavigationStart } from '@angular/router';

@Component({
	selector: 'app-notification-menu',
	templateUrl: './notification-menu.component.html',
	styleUrls: ['./notification-menu.component.scss']
})

export class NotificationMenuComponent implements OnDestroy {

	@Output() public open: boolean = false;
	public notifications$;

	private _routerEventsSub;

	constructor(
		public notificationService: NotificationService,
		public router: Router
	) {
		this.notifications$ = this.notificationService.findMany();

		this._routerEventsSub = this.router.events.subscribe((val) => {
			if (val instanceof NavigationStart)
				this.open = false;
		});
	}

	public toggleNotificationMenu(state?: boolean) {
		this.open = typeof state === 'boolean' ? state : !this.open;
		this.notificationService.resetUnreadCounter();
	}
	
	public onClickMarkAllAsRead(event) {
		event.preventDefault();
		event.stopPropagation();

		this.notificationService.markAllAsRead();
	}

	public onClickNotification(event, notification) {
		this.open = false;

		if (!notification.isRead)
			this.notificationService.markAsRead(notification._id);
	}

	ngOnDestroy() {
		this.notifications$.unsubscribe();
	}
}