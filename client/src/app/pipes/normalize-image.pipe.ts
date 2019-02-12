import { Pipe, PipeTransform } from "@angular/core";
import { ConfigService } from "../services/config/config.service";
import { normalizeUrl } from "../services/http.service";

@Pipe({ 
	name: 'NormalizeImgUrl' 
})
export class NormalizeImgUrlPipe implements PipeTransform {

	constructor(
		private _configService: ConfigService
	) {}

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

		if (!value.startsWith('/')) {
			if (type === 'comment') {
				value = '/image/comment/' + value;
			} else {
				value = '/image/profile/' + value;
			}
		}
		

		return normalizeUrl(this._configService.address.cdn.url + value);
		// return app.address.cdnUrl + value;
	}
}