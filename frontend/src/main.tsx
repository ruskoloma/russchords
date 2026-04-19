import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
// Brand typography — shipped ourselves via @fontsource/* so the app works
// offline (PWA) and doesn't depend on Google Fonts.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './index.css';
import '@mantine/core/styles.css';
import '@mantine/nprogress/styles.css';
import 'mantine-datatable/styles.layer.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ErrorPage, Layout, MrBeanLoader, NotFound } from './components';
// Eagerly imported pages — anything that must paint instantly on first load
// or is part of the OIDC redirect dance. Everything else is lazy-loaded via
// route `lazy` factories to keep the initial bundle lean.
import { HomePage } from './pages/HomePage';
import { AuthCallback, SilentRedirect } from './pages/Auth';
import { MantineProvider } from '@mantine/core';
import { AuthProvider } from './AuthProvider.tsx';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { ModalsProvider } from '@mantine/modals';
import TagManager from 'react-gtm-module';
import { colorSchemeManager, theme } from './theme';

// Initialize Google Tag Manager
const gtmId = import.meta.env.VITE_GTM_ID;
if (gtmId) {
	TagManager.initialize({ gtmId });
}

const router = createBrowserRouter([
	{
		path: '/auth/silent-callback',
		element: <SilentRedirect />,
	},
	{
		path: '/',
		element: <Layout />,
		errorElement: <ErrorPage />,
		children: [
			{
				index: true,
				element: <HomePage />,
				handle: { maxWidth: 900 },
			},
			{
				path: 'song/:id',
				handle: { maxWidth: 820 },
				lazy: async () => {
					const mod = await import('./pages/SongPage');
					return { Component: mod.SongPage, loader: mod.songLoader };
				},
			},
			{
				path: 'song/cached/:id',
				handle: { maxWidth: 820 },
				lazy: async () => {
					const mod = await import('./pages/CachedSongPage');
					return { Component: mod.CachedSongPage, loader: mod.cachedSongLoader };
				},
			},
			{
				path: 'my-songs',
				handle: { maxWidth: 1200 },
				lazy: async () => {
					const mod = await import('./pages/MySongsPage');
					return { Component: mod.MySongsPage, loader: mod.mySongsLoader };
				},
			},
			{
				path: 'song/edit/:id',
				handle: { maxWidth: 900 },
				lazy: async () => {
					const mod = await import('./pages/EditSongPage');
					return { Component: mod.EditSongPage, loader: mod.editSongPageLoader };
				},
			},
			{
				path: 'song/create',
				handle: { maxWidth: 900 },
				lazy: async () => {
					const mod = await import('./pages/CreateSongPage');
					return { Component: mod.CreateSongPage };
				},
			},
			{
				path: 'starred',
				handle: { maxWidth: 1200 },
				lazy: async () => {
					const mod = await import('./pages/StarredPage');
					return { Component: mod.StarredPage, loader: mod.starredPageLoader };
				},
			},
			{
				path: 'my-playlists',
				handle: { maxWidth: 1200 },
				lazy: async () => {
					const mod = await import('./pages/MyPlaylistsPage');
					return { Component: mod.MyPlaylistsPage, loader: mod.myPlaylistsPageLoader };
				},
			},
			{
				path: 'playlist/:id',
				handle: { maxWidth: 1000 },
				lazy: async () => {
					const mod = await import('./pages/PlaylistPage');
					return { Component: mod.PlaylistPage, loader: mod.playlistPageLoader };
				},
			},
			{
				path: 'playlist/:id/play',
				lazy: async () => {
					const mod = await import('./pages/PlaylistPlayMode');
					return { Component: mod.PlaylistPlayMode, loader: mod.playlistPlayModeLoader };
				},
				handle: { immersiveMode: true },
			},
			{
				path: 'playlist/:id/print',
				handle: { maxWidth: 900 },
				lazy: async () => {
					const mod = await import('./pages/PlaylistPrintPage');
					return { Component: mod.PlaylistPrintPage, loader: mod.playlistPrintPageLoader };
				},
			},
			{
				path: '/search',
				handle: { maxWidth: 900 },
				lazy: async () => {
					const mod = await import('./pages/SearchPage');
					return { Component: mod.SearchPage };
				},
			},
			{
				path: '*',
				element: <NotFound />,
			},
			{
				path: '/auth/callback',
				element: <AuthCallback />,
			},
		],
	},
]);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<MantineProvider theme={theme} defaultColorScheme="auto" colorSchemeManager={colorSchemeManager}>
			<ModalsProvider>
				<Notifications position="top-right" />
				<AuthProvider>
					<Suspense fallback={<MrBeanLoader />}>
						<RouterProvider router={router} />
					</Suspense>
				</AuthProvider>
			</ModalsProvider>
		</MantineProvider>
	</StrictMode>,
);
