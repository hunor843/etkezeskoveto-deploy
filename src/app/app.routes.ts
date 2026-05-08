import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		loadComponent: () =>
			import('./pages/home/home.page').then((m) => m.HomePageComponent),
	},
	{
		path: 'login',
		loadComponent: () =>
			import('./pages/login/login.page').then((m) => m.LoginPageComponent),
	},
	{
		path: 'forum',
		loadComponent: () =>
			import('./pages/forum/forum.page').then((m) => m.ForumPageComponent),
	},
	{
		path: 'forum/:topicId',
		loadComponent: () =>
			import('./pages/forum-topic-detail/forum-topic-detail.page').then(
				(m) => m.ForumTopicDetailPageComponent,
			),
	},
	{
		path: 'settings',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./pages/settings/settings.page').then((m) => m.SettingsPageComponent),
	},
	{
		path: 'profile',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./pages/profile/profile.page').then((m) => m.ProfilePageComponent),
	},
	{
		path: '**',
		loadComponent: () =>
			import('./pages/not-found/not-found.page').then(
				(m) => m.NotFoundPageComponent,
			),
	},
];
