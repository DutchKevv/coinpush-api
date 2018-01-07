import { Injectable, Output } from '@angular/core';
import { Http, Response } from '@angular/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { app } from '../../core/app';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class NotificationService {

	constructor(
		private _http: Http) {}

	findById(id: string, options: any = {}): Promise<any> {
		return this._http.get('/notify/' + id, { params: options }).map((res: Response) => res.json()).toPromise();
	}

	findMany(offset: number = 0, limit: number = 20): Observable<any> {
        return this._http.get('/notify', { params: { offset, limit } }).map(res => res.json());
    }

	async update(changes, toServer = true, showAlert: boolean = true) {
		
	}
}