import { Component, ChangeDetectionStrategy, EventEmitter, Output, ViewChild, ElementRef } from "@angular/core";
import { Subject } from "rxjs";
import { environment } from "environments/environment";
import { UserService } from "../../services/user.service";

@Component({
	selector: 'app-navigation-menu',
    styleUrls: ['./navigation-menu.component.scss'],
    templateUrl: 'navigation-menu.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class NavigationMenuComponent {

    public state: boolean = false;
    public version = 'v0.0.2-alpha-' + (environment.production ? 'prod' : 'dev');
    
    private _navBarPosition: number;
    private _navBarWidth: number;

    constructor(
        public userService: UserService,
        private _elementRf: ElementRef) {

    }

    public toggleNav(state?: boolean) {
		this._elementRf.nativeElement.classList.toggle('show', state);
		this.state = typeof state === 'boolean' ? state : !this.state;

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
}