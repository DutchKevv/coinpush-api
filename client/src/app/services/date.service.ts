import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class DateService {

	convertToTimePast(date: any): string {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }

        return '';
        // return timeAgo.format(date);
    }
}