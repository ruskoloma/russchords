import {
	IconHome2,
	IconMusic,
	IconPlaylist,
	IconSearch,
	IconStar,
	type Icon,
	type IconProps,
} from '@tabler/icons-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

export interface NavItem {
	to: string;
	label: string;
	icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
	requiresAuth: boolean;
	isActive: (pathname: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
	{
		to: '/',
		label: 'Home',
		icon: IconHome2,
		requiresAuth: false,
		isActive: (p) => p === '/',
	},
	{
		to: '/search',
		label: 'Search',
		icon: IconSearch,
		requiresAuth: false,
		isActive: (p) => p.startsWith('/search') || p.startsWith('/song/cached/'),
	},
	{
		to: '/my-songs',
		label: 'My songs',
		icon: IconMusic,
		requiresAuth: true,
		isActive: (p) => p.startsWith('/my-songs') || (p.startsWith('/song/') && !p.startsWith('/song/cached/')),
	},
	{
		to: '/starred',
		label: 'Starred',
		icon: IconStar,
		requiresAuth: true,
		isActive: (p) => p.startsWith('/starred'),
	},
	{
		to: '/my-playlists',
		label: 'Playlists',
		icon: IconPlaylist,
		requiresAuth: true,
		isActive: (p) => p.startsWith('/my-playlists') || p.startsWith('/playlist/'),
	},
];
