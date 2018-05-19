import { Component, ChangeDetectionStrategy, EventEmitter, Output, ViewChild, ElementRef, HostListener } from "@angular/core";
import { Subject } from "rxjs";
import { environment } from "environments/environment";
import { UserService } from "../../services/user.service";
import { AuthenticationService } from "../../services/authenticate.service";
import { app } from "../../../core/app";

declare let window: any;
declare let navigator: any;

@Component({
	selector: 'app-navigation-menu',
	styleUrls: ['./navigation-menu.component.scss'],
	templateUrl: 'navigation-menu.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class NavigationMenuComponent {

	public state: boolean = false;
	public version = 'v0.0.2-alpha-' + (environment.production ? 'prod' : 'dev');

	private _navBarWidth: number = this._elementRf.nativeElement.clientWidth;
	private _navBarPosition: number = -this._navBarWidth;
	private _touchStartX = 0

	/**
	 * mobile nav menu back press close
	 * @param event 
	 */
	@HostListener('window:popstate', ['$event'])
	onPopState(event) {
		this.toggleNav(false);
		return false;
	}


	/**
	 * mobile nav menu touch swipe
	 * @param event
	 */
	@HostListener('touchstart', ['$event'])
	onTouchStart(event) {
		if (!this.state)
			return;

		this._touchStartX = event.touches[0].clientX;
	}

	/**
	 * mobile nav menu touch swipe
	 * @param event 
	 */
	@HostListener('touchmove', ['$event'])
	onTouchMove(event) {
		if (!this.state)
			return;

		const diff = event.touches[0].clientX - this._touchStartX;

		this._updateNavPosition(diff * 2);
	}

	/**
	 * mobile nav menu touch swipe
	 * @param event 
	 */
	@HostListener('touchend', ['$event'])
	onTouchEnd(event) {
		if (!this.state)
			return;

		this._touchStartX = 0;

		this.toggleNav(this._navBarPosition > -(this._navBarWidth / 2));
	}

	constructor(
		public userService: UserService,
		private _authenticationService: AuthenticationService,
		private _elementRf: ElementRef) {
	}

	public toggleNav(state?: boolean) {
		this.state = typeof state === 'boolean' ? state : !this.state;
		this._elementRf.nativeElement.classList.toggle('show', this.state);

		this._navBarPosition = this.state ? 0 : -this._navBarWidth;
		this._elementRf.nativeElement.removeAttribute('style');

		// setTimeout(() => {
		// 	if (this._isNavOpen)
		// 		this.router.navigate(this.activatedRoute.snapshot.url, { queryParamsHandling: 'merge', queryParams: { menu: 1 }, relativeTo: this.activatedRoute })
		// 	else {
		// 		this.router.navigate(this.activatedRoute.snapshot.url, { queryParamsHandling: 'merge', queryParams: { menu: null }, replaceUrl: true, relativeTo: this.activatedRoute })
		// 	}
		// }, 0);
	}

	public logout(): void {
		this._authenticationService.logout();
	}

	private _updateNavPosition(distance: number) {
		this._navBarPosition = Math.max(-this._navBarWidth, Math.min(0, distance));
		this._elementRf.nativeElement.style.transform = `translateX(${this._navBarPosition}px)`;
	}
}