import { Injectable, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { app } from '../../core/app';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable()
export class NotificationService {

	public notifications = app.data.notifications;

	public get unreadCount() {
		return this._unreadCount;
	}

	private _unreadCount = parseInt(app.data.notifications.unreadCount, 10) || 0;

	constructor(private _http: HttpClient) {

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
}