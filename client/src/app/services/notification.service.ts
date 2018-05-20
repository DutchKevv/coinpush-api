import { Injectable, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { app } from '../../core/app';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpParams } from '@angular/common/http';
// import { INotification } from '../../../../shared/modules/coinpush/interface/notification.interface';
import { SocketService } from './socket.service';
import * as moment from 'moment';

import { INotification } from 'coinpush/interface/notification.interface';

@Injectable({
	providedIn: 'root',
})
export class NotificationService {

	public notifications = app.data.notifications;

	public unreadCount$: BehaviorSubject<number> = new BehaviorSubject(parseInt(app.data.notifications.unreadCount, 10) || 0);

	constructor(
		private _http: HttpClient,
		private _socketService: SocketService
	) {
		this.init();
	}

	init() {
		app.on('notification', (notification) => this._onNotification(notification));
		// this._socketService.socket.on('notification', notification => this._onNotification(notification));
	}

	findById(id: string, options: any = {}): Promise<any> {
		const params = new HttpParams({
			fromObject: options
		});

		return this._http.get('/notify/' + id, { params }).toPromise();
	}

	findMany(offset: number = 0, limit: number = 20): Observable<any> {
		const params = new HttpParams({
			fromObject: {
				offset: offset.toString(),
				limit: limit.toString()
			}
		});

		return this._http.get('/notify', { params }).map((notifications: any) => {
			notifications.forEach(notification => {
				notification.fromNow = moment(notification.createdAt).fromNow();
			})
			return notifications;
		});
	}

	public markAsRead(notification: INotification): Promise<Response> {
		notification.isRead = true;
		return <any>this._http.put('/notify/unread/' + notification._id, {}).toPromise();
	}

	public markAllAsRead(): Promise<Response> {
		console.log(this.notifications);
		// this.notifications.forEach((notification: INotification) => {
		// 	notification.isRead = true;
		// });

		return <any>this._http.put('/notify/unread', {}).toPromise();
	}

	public async resetUnreadCounter(): Promise<void> {
		if (this.unreadCount$.getValue() != 0) {
			this.unreadCount$.next(0);
			app.notification.updateBadgeCounter(0);
			await this._http.put('/notify/reset-unread-counter', {}).toPromise();
		}
	}

	async update(changes, toServer = true, showAlert: boolean = true) {

	}

	private _onNotification(notification) {
		console.log('NOTIFICATION!', notification);
		const unreadValue = this.unreadCount$.getValue();

		switch (notification.data.type) {
			/**
			 * COMMENTS EVENTS (LIKE, REACTION etc)
			 */
			case 'post-comment':
			case 'post-like':
			case 'comment-like':
				this.unreadCount$.next(unreadValue + 1);

				// jump to comment
				if (!notification.data.foreground) {
					let routeString =  '#/comment/' + notification.data.parentId || notification.data.commentId;

					if (notification.data.parentId) {
						routeString += '?focus=' + notification.data.commentId;
					}

					window.location.hash = routeString;
				}

				break;
			/**
			 * SYMBOL ALARM
			 */
			case 'symbol-alarm':
				this.unreadCount$.next(unreadValue + 1);

				// jump to symbol
				if (!notification.data.foreground) {
					window.location.hash = '#/symbols/?symbol=' + notification.data.symbol;
				}

				app.emit('event-triggered', notification.data);
				break
			default:
				console.error('Uknown notification type: ' + notification.data.type);
		}
	}
}