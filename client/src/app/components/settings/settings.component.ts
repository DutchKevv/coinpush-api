import {
	ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild,
	ViewEncapsulation
} from '@angular/core';
import { UserService } from '../../services/user.service';
import { FormBuilder } from '@angular/forms';
import { USER_FETCH_TYPE_PROFILE_SETTINGS, G_ERROR_MAX_SIZE } from 'coinpush/constant';
import { UserModel } from '../../models/user.model';
import { AuthenticationService } from '../../services/authenticate.service';
import { AlertService } from '../../services/alert.service';
import { HttpClient } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationBoxComponent } from '../confirmation-box/confirmation-box.component';

declare let $: any;

@Component({
	styleUrls: ['./settings.component.scss'],
	templateUrl: 'settings.component.html',
	// encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class SettingsComponent implements OnInit, OnDestroy {

	model: any;
	form: any;

	@ViewChild('profileImg') profileImg: ElementRef;
	@ViewChild('uploadBtn') uploadBtn: ElementRef;
	@ViewChild('uploadImageHolder') uploadImageHolder: ElementRef;
	@ViewChild('saveOptions') saveOptions: ElementRef;

	countries = window['countries'];

	constructor(
		private _http: HttpClient,
		private _formBuilder: FormBuilder,
		private _authenticationService: AuthenticationService,
		private _userService: UserService,
		private _modalService: NgbModal,
		private _alertService: AlertService) {
	}

	// TODO: Gets called twice!
	ngOnInit() {
		this.model = this._userService.model;

		this.form = this._formBuilder.group({
			name: this._userService.model.get('name'),
			email: this._userService.model.get('email'),
			description: this._userService.model.get('description') || '',
			country: this._userService.model.get('country'),
			gender: this._userService.model.get('gender'),
			'settings.lowMargin': 0,
			'settings.orderClosedByMarket': 0,
			'settings.userFollowsMe': 0,
			'settings.userCopiesMe': 0,
			'settings.like': 0,
			'settings.comment': 0,
			'settings.summary': 0,
		});

		this._userService.findById(this._userService.model.get('_id'), { type: USER_FETCH_TYPE_PROFILE_SETTINGS }).then((user: UserModel) => {

			this.form.setValue({
				name: user.options.name,
				email: user.options.email,
				country: user.options.country,
				description: user.options.description,
				gender: user.options.gender,
				'settings.lowMargin': +user.options.settings.lowMargin,
				'settings.orderClosedByMarket': +user.options.settings.orderClosedByMarket,
				'settings.userFollowsMe': +user.options.settings.userFollowsMe,
				'settings.userCopiesMe': +user.options.settings.userCopiesMe,
				'settings.like': +user.options.settings.like,
				'settings.comment': +user.options.settings.like,
				'settings.summary': +user.options.settings.summary,
			}, { onlySelf: true });

			this.form.valueChanges.subscribe(data => {
				const changes = {};

				Object.keys(data).forEach(key => {
					if (data[key] !== null)
						changes[key] = data[key];
				});

				this._userService.update(changes);
			});
		});
	}

	public showDeleteAccountConfirmationBox() {
		const self = this;

		const modalRef = this._modalService.open(ConfirmationBoxComponent);
		modalRef.componentInstance.title = 'Remove account';
		modalRef.componentInstance.text = 'Do you really want to remove your account?';
		modalRef.componentInstance.buttons = [
			{
				text: 'remove',
				type: 'danger',
				async onClick() {
					await self.removeAccount();
					modalRef.componentInstance.destroy();
				}
			},
			{
				text: 'cancel',
				type: 'success',
				onClick() {
					modalRef.componentInstance.destroy();
				}
			}
		];
	}

	onChangeFileInput(event) {
		const input = event.target;

		this.toggleSaveOptionsVisibility(input.files && input.files[0]);

		if (input.files && input.files[0]) {
			let reader = new FileReader();

			reader.onload = (e) => this.setProfileImgPreview(e.target['result']);

			reader.readAsDataURL(input.files[0]);
		}
	}

	saveProfileImg() {
		this.toggleSaveOptionsVisibility(false);

		let data = new FormData();
		data.append('image', this.uploadBtn.nativeElement.files.item(0));

		this._http.post('/upload/profile', data).subscribe((result: any) => {
			this._userService.update({ img: result.url }, false);
		}, (result) => {
			switch (result.status) {
				case 413:
					this._alertService.error('Max file size is 3MB');
					break;
				default:
					try {
						const error = JSON.parse(result).error;

						switch (error.code) {
							case G_ERROR_MAX_SIZE:
								this._alertService.error('Max file size is 10MB');
								break;
						}
					} catch (catchError) {
						this._alertService.error('Error uploading image');
						console.error(result)
					}
			}
		});
	}

	resetProfileImg() {
		this.setProfileImgPreview(this.model.options.img);
		this.uploadBtn.nativeElement.value = '';
		this.toggleSaveOptionsVisibility(false);
	}

	setProfileImgPreview(url: string) {
		this.uploadImageHolder.nativeElement.style.background = 'url(' + url + ')';
	}

	toggleSaveOptionsVisibility(state) {
		this.saveOptions.nativeElement.classList.toggle('hidden', !state);
	}

	onChange(event) {
		// this._userService.update(this.model);
		console.log(event);
	}

	async removeAccount() {
		const result = await this._userService.remove();
		this._authenticationService.logout();
	}

	ngOnDestroy() {

	}
}