import {
	ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild,
	ViewEncapsulation
} from '@angular/core';
import {UserService} from '../../services/user.service';
import {Http} from '@angular/http';
import {FormBuilder} from '@angular/forms';
import {USER_FETCH_TYPE_PROFILE_SETTINGS} from '../../../../../shared/constants/constants';
import {UserModel} from '../../models/user.model';

declare let $: any;

@Component({
	styleUrls: ['./settings.component.scss'],
	templateUrl: 'settings.component.html',
	encapsulation: ViewEncapsulation.Native,
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

	constructor(private _http: Http,
				private _formBuilder: FormBuilder,
				private _userService: UserService) {
	}

	// TODO: Gets called twice!
	ngOnInit() {
		this.model = this._userService.model;

		this.form = this._formBuilder.group({
			name: this._userService.model.get('name'),
			email: this._userService.model.get('email'),
			description: this._userService.model.get('description'),
			country: this._userService.model.get('country'),
			balance: this._userService.model.get('balance'),
			leverage: this._userService.model.get('leverage'),
		});

		this._userService.find(this._userService.model.get('user_id'), USER_FETCH_TYPE_PROFILE_SETTINGS).subscribe((user: UserModel) => {
			console.log(user.options);

			this.form.setValue({
				name: user.options.name,
				email: user.options.email,
				country: user.options.country,
				description: user.options.description,
				balance: this._userService.model.get('balance'),
				leverage: this._userService.model.get('leverage')
			}, {onlySelf: true});

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

		this._http.post('/upload/profile', data).map(res => res.json()).subscribe((result) => {
			this._userService.update({profileImg: result.url}, false);
		}, (error) => console.error(error));
	}

	resetProfileImg() {
		this.setProfileImgPreview(this.model.options.profileImg);
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
		console.log(event);
	}

	ngOnDestroy() {

	}
}