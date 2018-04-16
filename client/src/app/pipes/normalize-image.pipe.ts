import { Pipe, PipeTransform } from "@angular/core";
import { app } from "../../core/app";
import { environment } from '../../environments/environment';

@Pipe({ name: 'NormalizeImgUrl' })
export class NormalizeImgUrlPipe implements PipeTransform {

	transform(value: string, type: string = 'user'): string {
		if (!value) {
			if (type === 'user') {
				return '/assets/image/default-profile.jpg';
			} else {
				return '';
			}
		}

		if (value.startsWith('http'))
			return value;

		if (!value.startsWith('/'))
			value = '/images/profile/' + value;

		return app.address.hostUrl + value;
	}
}