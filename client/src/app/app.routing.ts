import { RouterModule, Routes } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';
import { AuthGuard } from './guards/auth.guard';
import { UserOverviewComponent } from './components/user-overview/user.overview.component';
import { ChartOverviewComponent } from './components/chart-overview/chart-overview.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SettingsComponent } from './components/settings/settings.component';
import { SocialFeedComponent } from './components/social-feed/social.feed.component';
import { PasswordResetComponent } from "./components/password-reset/password-reset.component";
import { RequestPasswordResetComponent } from "./components/request-password-reset/request-password-reset.component";
import { EventOverviewComponent } from './components/event-overview/event-overview.component';

const routes: Routes = [
	{ path: '', redirectTo: 'symbols', pathMatch: 'full', canActivate: [AuthGuard] },
	{ path: 'password-reset', component: PasswordResetComponent },
	{ path: 'request-password-reset', component: RequestPasswordResetComponent },

	{ path: 'comment/:id', component: SocialFeedComponent, canActivate: [AuthGuard] },
	{ path: 'user', component: UserOverviewComponent, canActivate: [AuthGuard] },
	{ path: 'calendar', component: EventOverviewComponent, canActivate: [AuthGuard] },
	{
		path: 'user/:id', component: ProfileComponent, children:
			[
				{ path: '', redirectTo: 'feed', pathMatch: 'full' },
				{ path: 'feed', component: SocialFeedComponent }
			]
	},
	{ path: 'symbols', component: ChartOverviewComponent, canActivate: [AuthGuard] },
	{ path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
];

export const AppRouter: ModuleWithProviders = RouterModule.forRoot(routes, {
	useHash: true,
});