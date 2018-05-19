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

	public markAsRead(notificationId: string): Promise<Response> {
		return <any>this._http.put('/notify/unread/' + notificationId, {}).toPromise();
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

	private async _onNotification(notification) {
		console.log('NOTIFICATION!', notification);
		const unreadValue = this.unreadCount$.getValue();

		switch (notification.data.type) {
			case 'post-comment':
				this.unreadCount$.next(unreadValue + 1);
				// window.location.hash = '#/comment/' + notification.data.parentId + '?focus=' + notification.data.commentId;
				break;
			case 'post-like':
				this.unreadCount$.next(unreadValue + 1);
				// window.location.hash = '#/comment/' + notification.data.commentId;
				break;
			case 'comment-like':
				this.unreadCount$.next(unreadValue + 1);
				// window.location.hash = '#/comment/' + notification.data.parentId + '?focus=' + notification.data.commentId;
				break
			case 'symbol-alarm':
				this.unreadCount$.next(unreadValue + 1);
				// window.location.hash = '#/symbols/?symbol=' + notification.data.symbol;
				app.emit('event-triggered', Object.assign(notification, { title: notification.title }));
				break
			default:
				console.error('Uknown notification type: ' + notification.data.type);
		}
	}
}