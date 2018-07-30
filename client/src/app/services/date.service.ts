import { Injectable } from '@angular/core';
import * as TimeAgo2 from 'time-ago';

@Injectable({
	providedIn: 'root'
})
export class DateService {

	convertToTimePast(date: any): string {
        return TimeAgo2.ago(date);
    }
}