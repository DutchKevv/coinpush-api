import { Injectable } from '@angular/core';
import TimeAgo from 'javascript-time-ago'
import * as en from 'javascript-time-ago/locale/en'

// Add locale-specific relative date/time formatting rules.
TimeAgo.locale(en)
const timeAgo = new TimeAgo('en-US')

@Injectable({
	providedIn: 'root',
})
export class DateService {

	convertToTimePast(date: any): string {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }

        return timeAgo.format(date);
    }
}