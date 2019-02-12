import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SocketService } from './socket.service';
import { map } from 'rxjs/operators';

import { INotification } from 'coinpush/src/interface/notification.interface';
import { DateService } from './date.service';
import { ConfigService } from './config/config.service';

declare let firebase: any;
declare let PushNotification: any;

@Injectable({
	providedIn: 'root',
})
export class NotificationService {

	public notifications = [];
	public notifications$ = null;

	public firebaseToken$: BehaviorSubject<string> = new BehaviorSubject('');
	public unreadCount$: BehaviorSubject<number> = new BehaviorSubject(0);
	// public unreadCount$: BehaviorSubject<number> = new BehaviorSubject(app.data.notifications ? parseInt(app.data.notifications.unreadCount, 10) : 0);

	private _firebase: any;

	constructor(
		private _http: HttpClient,
		private _socketService: SocketService,
		private _dateService: DateService,
		private _configService: ConfigService
	) {}

	async init() {
		this.notifications$ = this.findMany();
		// app.on('notification', (notification) => this._onNotification(notification));

		// only if authenticated
		// if (!app.storage.profileData._id)
		// 	return;

		if (this._configService.platform.isApp) {
			await this._loadApp();
		} else {
			await this._loadBrowser();
			// this._socketService.socket.on('notification', notification => this._onNotification(notification));
		}
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
		// this.notifications.forEach((notification: INotification) => {
		// 	notification.isRead = true;
		// });

		return <any>this._http.put('/notify/unread', {}).toPromise();
	}

	public async resetUnreadCounter(): Promise<void> {
		if (this.unreadCount$.getValue() != 0) {
			this.unreadCount$.next(0);
			await this._http.put('/notify/reset-unread-counter', {}).toPromise();
		}
	}

	async update(changes, toServer = true, showAlert: boolean = true) {

	}

	/**
     * ask user to allow push messages on browser
     */
	public async askPermissionBrowser() {
		try {
			await this._firebase.requestPermission();
			const firebaseToken = await this._firebase.getToken();
			this.firebaseToken$.next(firebaseToken);
			// app.emit('firebase-token-refresh', this._firebaseToken);
		} catch (error) {
			console.error(error);
		}
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
			case 'new-wall-post':
				this.unreadCount$.next(unreadValue + 1);

				// jump to comment
				if (!notification.data.foreground) {
					let routeString = '#/comment/' + notification.data.parentId || notification.data.commentId;

					if (notification.data.parentId) {
						routeString += '?focus=' + notification.data.commentId;
					}

					window.location.hash = routeString;
				}

				break;
			case 'user-follow':
				this.unreadCount$.next(unreadValue + 1);

				// jump to comment
				if (!notification.data.foreground) {
					let routeString = '#/user/' + notification.data.fromUser._id

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

				// app.emit('price-alarm', notification.data);
				break
			default:
				console.error('Uknown notification type: ' + notification.data.type);
		}
	}

	/**
	* browser (firebase)
	*/
	private _loadBrowser(): Promise<any> {
		return new Promise((resolve, reject) => {
			// firebase script
			let script = document.createElement('script');
			script.src = 'https://www.gstatic.com/firebasejs/4.8.1/firebase.js';
			script.async = true;
			script.onload = () => {

				const config = {
					apiKey: "AAAAcOdrZII:APA91bHdt3bPaqUW4sWF7tht0xJs13B_X-4Svm4TlWeLnXXFoVsPxWRQGxUPdqudCP1OHkQ-IJCVO10DJKi8G2fLekqfpy0xAXGakQmj-7FZW3DwB18BxcHNIWlgNC9T3T1tbXEnbaxM",
					// authDomain: "<PROJECT_ID>.firebaseapp.com",
					messagingSenderId: '484918912130',
				};

				firebase.initializeApp(config);
				this._firebase = window['messaging_'] = firebase.messaging();

				this._firebase.onMessage((message) => {
					// function is only get called when on foreground 
					message.data.foreground = true;
					this._onNotification(message);
				});

				this._firebase.onTokenRefresh(async () => {
					const firebaseToken = await this._firebase.getToken();
					this.firebaseToken$.next(firebaseToken);
					// app.emit('firebase-token-refresh', this._firebaseToken);
				});

				this.askPermissionBrowser().catch(console.error);

				resolve();
			}

			document.head.appendChild(script);
		});
	}

	private async _loadApp() {
		const push = PushNotification.init({
			android: {
				icon: "icon",
				sound: true,
				vibrate: true,
				iconColor: "#ffd700"
			},
			browser: {
				pushServiceURL: 'http://push.api.phonegap.com/v1/push'
			},
			ios: {
				alert: "true",
				badge: "true",
				sound: "true"
			},
			windows: {}
		});

		push.on('registration', (data) => {
			this.firebaseToken$.next(data.registrationId);
			// app.emit('firebase-token-refresh', this._token);
		});

		push.on('notification', (data) => {
			console.log('PushNotification!', data);
			data.data = Object.assign({}, data.additionalData);
			delete data.additionalData;
			this._onNotification(data);
		});

		push.on('error', error => {
			console.log(error);
		});

		push.on('accept', (data) => {
			console.log('accept????', data);
			// do something with the notification data

			push.finish(() => {
				console.log('accept callback finished');
			}, () => {
				console.log('accept callback failed');
			}, data.additionalData.notId);
		});

		push.on('reject', (data) => {
			console.log('asdfasdf', data);
			// do something with the notification data

			push.finish(() => {
				console.log('accept callback finished');
			}, () => {
				console.log('accept callback failed');
			}, data.additionalData.notId);
		});

		push.on('maybe', (data) => {
			console.log('maybe???????', data);
			// do something with the notification data

			push.finish(() => {
				console.log('accept callback finished');
			}, () => {
				console.log('accept callback failed');
			}, data.additionalData.notId);
		});

		PushNotification.createChannel(
			() => {
				console.log('success');
			},
			() => {
				console.log('error');
			},
			{
				id: 'channel1',
				description: 'My first test channel',
				importance: 3
			}
		);

		PushNotification.hasPermission(data => {
			if (!data.isEnabled) {
				console.log('NO PUSH PERMISSION!');
			}
		});

		// cordova.plugins.firebase.messaging.requestPermission((data) => {
		//     cordova.plugins.firebase.messaging.getToken(token => {
		//         this._token = token;
		//         app.emit('firebase-token-refresh', this._token);
		//     }, console.error);
		// });

		// cordova.plugins.firebase.messaging.onMessage(notification => this._onNotification(notification), function (error) {
		//     throw error;
		// });

		// cordova.plugins.firebase.messaging.onTokenRefresh((token) => {
		//     this._token = token;
		//     app.emit('firebase-token-refresh', this._token);
		// }, function (error) {
		//     console.error(error);
		// });
	}
}