import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../../services/user.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { USER_FETCH_TYPE_PROFILE_SETTINGS } from 'coinpush/src/constant';
import { UserModel } from '../../models/user.model';
import { AuthService } from '../../services/auth/auth.service';
import { AlertService } from '../../services/alert.service';
import { HttpClient } from '@angular/common/http';
import { ModalService } from '../../services/modal/modal.service';
import { AccountService } from '../../services/account/account.service';

@Component({
	selector: 'app-settings-overview',
	styleUrls: ['./settings.component.scss'],
	templateUrl: 'settings.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class SettingsComponent implements OnInit, OnDestroy {

	public activeTab: string = 'profile';
	public form: FormGroup;

	@ViewChild('profileImg') profileImg: ElementRef;
	@ViewChild('uploadBtn') uploadBtn: ElementRef;
	@ViewChild('uploadImageHolder') uploadImageHolder: ElementRef;
	@ViewChild('uploadImageLoading') uploadImageLoading: ElementRef;
	@ViewChild('saveOptions') saveOptions: ElementRef;

	public countries = window['countries'];
	public account = this._accountService.account$.getValue();

	constructor(
		private _http: HttpClient,
		private _formBuilder: FormBuilder,
		private _authenticationService: AuthService,
		private _userService: UserService,
		private _accountService: AccountService,
		private _modalService: ModalService,
		private _alertService: AlertService) {
	}

	// TODO: Gets called twice!
	async ngOnInit() {
		const account = this._accountService.account$.getValue();

		this.form = this._formBuilder.group({
			name: new FormControl(account.name, {
				updateOn: 'blur'
			}),
			email: [account.email],
			description: [account.description || ''],
			country: [account.country],
			gender: [account.gender]
		}, { updateOn: 'blur' });

		// this.userModel = await this._userService.findById(this.userModel.get('_id'), { type: USER_FETCH_TYPE_PROFILE_SETTINGS }).toPromise();

		// this.form.setValue({
		// 	name: this.userModel.options.name,
		// 	email: this.userModel.options.email,
		// 	country: this.userModel.options.country,
		// 	description: this.userModel.options.description,
		// 	gender: this.userModel.options.gender,
		// 	'settings.lowMargin': +this.userModel.options.settings.lowMargin,
		// 	'settings.orderClosedByMarket': +this.userModel.options.settings.orderClosedByMarket,
		// 	'settings.userFollowsMe': +this.userModel.options.settings.userFollowsMe,
		// 	'settings.userCopiesMe': +this.userModel.options.settings.userCopiesMe,
		// 	'settings.like': +this.userModel.options.settings.like,
		// 	'settings.comment': +this.userModel.options.settings.like,
		// 	'settings.summary': +this.userModel.options.settings.summary,
		// });
		// }, { onlySelf: true, updateOn: 'blur' });

		this.form.valueChanges.subscribe(data => {
			const changes = {};

			Object.keys(data).forEach(key => {
				if (data[key] !== null) changes[key] = data[key];
			});

			this._accountService.update(changes, false, true);
		});
	}

	public toggleTab(tabName: string) {
		this.activeTab = tabName;
	}

	public showDeleteAccountConfirmationBox() {
		const self = this;

		// const modalRef = this._modalService.open(ConfirmationBoxComponent);
		// modalRef.componentInstance.title = 'Remove account';
		// modalRef.componentInstance.text = 'Do you really want to remove your account?';
		// modalRef.componentInstance.buttons = [
		// 	{
		// 		text: 'remove',
		// 		type: 'danger',
		// 		async onClick() {
		// 			await self.removeAccount();
		// 			modalRef.componentInstance.destroy();
		// 		}
		// 	},
		// 	{
		// 		text: 'cancel',
		// 		type: 'success',
		// 		onClick() {
		// 			modalRef.componentInstance.destroy();
		// 		}
		// 	}
		// ];
	}

	public onChangeFileInput(event) {
		const input = event.target;

		this.toggleSaveOptionsVisibility(input.files && input.files[0]);

		if (input.files && input.files[0]) {
			let reader = new FileReader();

			// !local! image ready 
			reader.onload = (e) => this.setProfileImgPreview(e.target['result']);

			// read !local! image
			reader.readAsDataURL(input.files[0]);
		}
	}

	public async saveProfileImg() {
		this.toggleSaveOptionsVisibility(false);

		this.uploadImageLoading.nativeElement.classList.add('active');

		let data = new FormData();
		data.append('image', this.uploadBtn.nativeElement.files.item(0));

		try {
			// upload profile image
			const result: any = await this._http.post('/upload/profile', data).toPromise();

			// store locally (skip re-sending to server)
			this._accountService.update({ img: result.url }, false);

		} catch (result) {
			switch (result.status) {
				case 413:
					this._alertService.error(result.error.message || 'Max file reached');
					break;
				default:
					this._alertService.error('Error uploading image');
					console.error(result)
			}
		} finally {
			this.uploadImageLoading.nativeElement.classList.remove('active');
		}
	}

	public resetProfileImg() {
		this.setProfileImgPreview(this._accountService.account$.getValue().img);
		this.uploadBtn.nativeElement.value = '';
		this.toggleSaveOptionsVisibility(false);
	}

	public setProfileImgPreview(url: string) {
		this.uploadImageHolder.nativeElement.style.background = 'url(' + url + ')';
	}

	public toggleSaveOptionsVisibility(state) {
		this.saveOptions.nativeElement.classList.toggle('hidden', !state);
	}

	public onChange(event) {
		console.log(event);		
	}

	private _setFormValue() {
		
	}

	async removeAccount() {
		const result = await this._userService.remove();
		this._authenticationService.logout();
	}

	ngOnDestroy() {

	}
}