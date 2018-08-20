import { RouterModule, Routes } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';
import { AuthGuard } from './guards/auth.guard';
import { UserOverviewComponent } from './components/user-overview/user.overview.component';
import { ChartOverviewComponent } from './components/chart-overview/chart-overview.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SettingsComponent } from './components/settings/settings.component';
import { SocialFeedComponent } from './components/social-feed/social.feed.component';
import { EventOverviewComponent } from './components/event-overview/event-overview.component';
import { TimelineComponent } from './components/timeline/timeline.component';

const routes: Routes = [
	{ path: '', redirectTo: 'symbols', pathMatch: 'full'},
	{ path: 'timeline', component: TimelineComponent, canActivate: [AuthGuard] },
	{ path: 'comment/:id', component: SocialFeedComponent, canActivate: [AuthGuard] },
	{ path: 'user', component: UserOverviewComponent, canActivate: [AuthGuard] },
	{ path: 'calendar', component: EventOverviewComponent, canActivate: [AuthGuard] },
	{ path: 'user/:id', component: ProfileComponent, canActivate: [AuthGuard] },
	{ path: 'symbols', component: ChartOverviewComponent, canActivate: [AuthGuard] },
	{ path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
	{ path: '**', redirectTo: 'symbols', pathMatch: 'full' }
];

export const AppRouter: ModuleWithProviders = RouterModule.forRoot(routes, {
	useHash: true,
});