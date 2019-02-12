import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { AppRouter } from './app.routing';
import { ChartOverviewComponent } from './components/chart-overview/chart-overview.component';
import { LoginComponent } from './components/login/login.component';
import { ChartBoxComponent } from './components/chart-box/chart-box.component';
import { CustomHttp } from './services/http.service';
import { AlertComponent } from './components/alert/alert.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { UserOverviewComponent } from './components/user-overview/user.overview.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ParseCommentContentPipe, SocialFeedComponent } from './components/social-feed/social.feed.component';
import { CommentBoxComponent } from './components/comment-box/comment-box.component';
import { BootstrapService } from "./services/bootstrap.service";
import { EventOverviewComponent } from './components/event-overview/event-overview.component';
import { AlarmMenuComponent, AlarmMenuActiveSymbolEventPipe } from './components/alarm-menu/alarm-menu.component';
import { NotificationMenuComponent } from './components/notification-menu/notification-menu.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { NormalizeImgUrlPipe } from './pipes/normalize-image.pipe';
import { HeaderComponent } from './components/header/header.component';
import { NavigationMenuComponent } from './components/navigation-menu/navigation-menu.component';
import { InstrumentListComponent, FilterIFavoritePipe } from './components/instrument-list/instrument-list.component';
import { MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material';
import { ModalComponent } from './components/modal/modal.component';
import { HeaderComponentModule } from './components/header/header.component.module';
import { NormalizeImageUrlPipeModule } from './pipes/normalize-image.pipe.module';
import { NavigationMenuComponentModule } from './components/navigation-menu/navigation-menu.component.module';

@NgModule({
	declarations: [
		AppComponent,
		AlarmMenuComponent,
		ChartBoxComponent,
		ChartOverviewComponent,
		InstrumentListComponent,
		EventOverviewComponent,
		ParseCommentContentPipe,
		FilterIFavoritePipe,
		SocialFeedComponent,
		AlertComponent,
		UserOverviewComponent,
		ProfileComponent,
		SettingsComponent,
		CommentBoxComponent,
		TimelineComponent,
		AlarmMenuActiveSymbolEventPipe
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		AppRouter,
		FormsModule,
		ReactiveFormsModule,
		HttpClientModule,
		MatDialogModule,
		HeaderComponentModule,
		NavigationMenuComponentModule,
		NormalizeImageUrlPipeModule
	],
	providers: [
		{ provide: APP_INITIALIZER, useFactory: (config: BootstrapService) => () => config.load(), deps: [BootstrapService], multi: true },
		{ provide: HTTP_INTERCEPTORS, useClass: CustomHttp, multi: true },
		{
			provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {
				hasBackdrop: true,
				closeOnNavigation: true,
				autoFocus: false,
				disableClose: true
			}
		},
	],
	bootstrap: [
		AppComponent
	],

	entryComponents: [LoginComponent, ModalComponent]
})

export class AppModule {
}