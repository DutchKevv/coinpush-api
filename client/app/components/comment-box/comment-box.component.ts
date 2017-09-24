import {ChangeDetectionStrategy, Component, ElementRef, Input, NgZone, OnInit, ViewEncapsulation} from '@angular/core';
import {UserService} from '../../services/user.service';
import {Http} from '@angular/http';
import {FormBuilder} from '@angular/forms';

@Component({
	selector: 'app-comment-box',
	styleUrls: ['./comment-box.component.scss'],
	templateUrl: 'comment-box.component.html',
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class CommentBoxComponent implements OnInit {
	@Input() model;

	form: any;

	constructor(private _http: Http,
				private _zone: NgZone,
				private _elementRef: ElementRef,
				private _formBuilder: FormBuilder,
				private _userService: UserService) {


	}

	ngOnInit() {

	}

	post() {

	}

	onChangeFileInput(event) {

	}
}