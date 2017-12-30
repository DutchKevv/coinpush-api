import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

@Injectable()
export class AuthGuard implements CanActivate {

	async canActivate(): Promise<boolean> {
		
		return true;
	}
}