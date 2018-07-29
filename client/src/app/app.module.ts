import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AppRouter } from './app.routing';
import { ChartOverviewComponent } from './components/chart-overview/chart-overview.component';
import { LoginComponent } from './components/login/login.component';
import { ChartBoxComponent } from './components/chart-box/chart-box.component';
import { CustomHttp } from './services/http.service';
import { AlertComponent } from './components/alert/alert.component';
import { HttpClientModule,HTTP_INTERCEPTORS } from '@angular/common/http';
import { UserOverviewComponent } from './components/user-overview/user.overview.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ParseCommentContentPipe, SocialFeedComponent } from './components/social-feed/social.feed.component';
import { CommentBoxComponent } from './components/comment-box/comment-box.component';
import { BootstrapService } from "./services/bootstrap.service";
import { EventOverviewComponent } from './components/event-overview/event-overview.component';
import { AlarmMenuComponent, AlarmMenuActiveSymbolEventPipe } from './components/alarm-menu/alarm-menu.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NotificationMenuComponent } from './components/notification-menu/notification-menu.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { NormalizeImgUrlPipe } from './pipes/normalize-image.pipe';
import { ConfirmationBoxComponent } from './components/confirmation-box/confirmation-box.component';
import { HeaderComponent } from './components/header/header.component';
import { NavigationMenuComponent } from './components/navigation-menu/navigation-menu.component';
import { InstrumentListComponent, FilterIFavoritePipe } from './components/instrument-list/instrument-list.component';

@NgModule({
	declarations: [
		AppComponent,
		HeaderComponent,
		NavigationMenuComponent,
		AlarmMenuComponent,
		NotificationMenuComponent,
		ChartBoxComponent,
		ChartOverviewComponent,
		InstrumentListComponent,
		EventOverviewComponent,
		ParseCommentContentPipe,
		FilterIFavoritePipe,
		SocialFeedComponent,
		LoginComponent,
		AlertComponent,
		UserOverviewComponent,
		ProfileComponent,
		SettingsComponent,
		CommentBoxComponent,
		TimelineComponent,
		AlarmMenuActiveSymbolEventPipe,
		NormalizeImgUrlPipe,
		ConfirmationBoxComponent
	],
	imports: [
		BrowserModule,
		AppRouter,
		FormsModule,
		ReactiveFormsModule,
		HttpClientModule,
		NgbModule.forRoot()
	],
	providers: [
		{ provide: APP_INITIALIZER, useFactory: (config: BootstrapService) => () => config.load(), deps: [BootstrapService], multi: true },
		{ provide: HTTP_INTERCEPTORS, useClass: CustomHttp, multi: true }
	],
	bootstrap: [
		AppComponent
	],

	entryComponents: [LoginComponent, ConfirmationBoxComponent]
})

export class AppModule {
}