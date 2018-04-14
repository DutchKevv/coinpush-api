import { Pipe, PipeTransform } from "@angular/core";
import { app } from "../../core/app";
import { environment } from '../../environments/environment';

@Pipe({ name: 'NormalizeImgUrl' })
export class NormalizeImgUrlPipe implements PipeTransform {

	transform(value: string): string {
        return app.address.hostUrl + value;
	}
}