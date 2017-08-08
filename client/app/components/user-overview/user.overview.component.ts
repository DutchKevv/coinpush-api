import {debounce} from 'lodash';
import {
	Component, ElementRef, OnInit, OnDestroy, ChangeDetectionStrategy,
	AfterViewChecked, ViewEncapsulation, Output, Response
} from '@angular/core';
import {InstrumentsService} from '../../services/instruments.service';
import {UserService} from '../../services/user.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {UserModel} from '../../models/user.model';

declare let $: any;

@Component({
	selector: 'app-user-overview',
	templateUrl: './user.overview.component.html',
	styleUrls: ['./user.overview.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class UserOverviewComponent implements OnInit, OnDestroy, AfterViewChecked {

	@Output() public users$: BehaviorSubject<[]> = new BehaviorSubject([]);

	private _moveInterval;

	constructor(public instrumentsService: InstrumentsService,
				private _userService: UserService) {
	}

	ngOnInit() {
		return this._userService.getList().subscribe(users => {
			console.log(users);
			this.users$.next(users.map(user => new UserModel(user)));
		});
	}

	ngAfterViewChecked() {
		this.setMoveInterval();
	}

	setMoveInterval() {
		this._moveTimeout = setInterval(() => this.moveCards());
	}

	clearMoveInterval() {
		clearInterval(this._moveInterval);
	}

	moveCards() {

	}

	toggleFollow(state: boolean, model: UserModel) {
		this._userService.toggleFollow(state, model).subscribe(result => {

		}, error => {

		});
	}

	ngOnDestroy() {
		$(window).off('resize.debugger');
	}
}