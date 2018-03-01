import { Injectable, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { app } from '../../core/app';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpParams } from '@angular/common/http';
// import { INotification } from '../../../../shared/modules/coinpush/interface/notification.interface';
import { SocketService } from './socket.service';

@Injectable()
export class NotificationService {

	public notifications = app.data.notifications;

	public get unreadCount() {
		return this._unreadCount;
	}

	private _unreadCount = parseInt(app.data.notifications.unreadCount, 10) || 0;

	constructor(
		private _http: HttpClient,
		private _socketService: SocketService
	) {
		this.init();
	}

	init() {
		app.on('notification', (notification) => this._onNotification(notification));
		this._socketService.socket.on('notification', notification => this._onNotification(notification));
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

		return this._http.get('/notify', { params });
	}

	public markAsRead(notificationId: string): Promise<Response> {
		return <any>this._http.put('/notify/unread/' + notificationId, {}).toPromise();
	}

	public markAllAsRead(): Promise<Response> {
		return <any>this._http.put('/notify/unread', {}).toPromise();
	}

	public async resetUnreadCounter(): Promise<void> {
		if (this.unreadCount != 0) {
			this._unreadCount = 0;
			app.notification.updateBadgeCounter(0);
			await this._http.put('/notify/reset-unread-counter', {}).toPromise();
		}
	}

	async update(changes, toServer = true, showAlert: boolean = true) {

	}

	private async _onNotification(notification) {
		alert('sdf');
		console.log('NOTIFICATION!', notification);
		switch (notification.type) {
			case 'post-comment':
				window.location.hash = '#/comment/' + notification.data.parentId + '?focus=' + notification.data.commentId;
				break;
			case 'post-like':
				window.location.hash = '#/comment/' + notification.data.commentId;
				break;
			case 'comment-like':
				window.location.hash = '#/comment/' + notification.data.parentId + '?focus=' + notification.data.commentId;
				break
			case 'symbol-alarm':
				window.location.hash = '#/symbols/?symbol=' + notification.data.symbol;
				app.emit('event-triggered', Object.assign(notification, { title: notification.data.title }));
				break
			default:
				console.error('Uknown notification type: ' + notification.type);
		}
	}
}