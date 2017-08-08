import {Injectable} from '@angular/core';
import * as CONSTANTS from '../../../shared/constants/constants';

@Injectable()
export class ConstantsService {

	public constants: any;

	constructor() {
	}

	init() {
		this.constants = CONSTANTS;
	}
}