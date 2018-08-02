import { Injectable, Output } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { app } from '../../core/app';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SocketService } from './socket.service';
import { map } from 'rxjs/operators';

import { INotification } from 'coinpush/src/interface/notification.interface';
import { DateService } from './date.service';

@Injectable({
	providedIn: 'root',
})
export class NotificationService {

	public notifications = app.data.notifications;
	public notifications$ = null;

	public unreadCount$: BehaviorSubject<number> = new BehaviorSubject(app.data.notifications ? parseInt(app.data.notifications.unreadCount, 10) : 0);

	constructor(
		private _http: HttpClient,
		private _socketService: SocketService,
		private _dateService: DateService
	) {
		this.init();
	}

	init() {
		this.notifications$ = this.findMany();
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

		return this._http.get('/notify', { params }).pipe(map((notifications: any) => {
			notifications.forEach(notification => {
				notification.fromNow = this._dateService.convertToTimePast(notification.createdAt);
			})
			return notifications;
		}));
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