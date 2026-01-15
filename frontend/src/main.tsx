import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@mantine/core/styles.css';
import 'mantine-datatable/styles.layer.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ErrorPage, Layout, NotFound } from './components';
import {
	AuthCallback,
	cachedSongLoader,
	CachedSongPage,
	CreateSongPage,
	EditSongPage,
	editSongPageLoader,
	HomePage,
	myPlaylistsPageLoader,
	mySongsLoader,
	MySongsPage,
	PlaylistPage,
	playlistPageLoader,
	SearchPage,
	SilentRedirect,
	songLoader,
	SongPage,
	StarredPage,
	starredPageLoader,
} from './pages';
import { MantineProvider } from '@mantine/core';
import { AuthProvider } from './AuthProvider.tsx';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { ModalsProvider } from '@mantine/modals';
import MyPlaylistsPage from './pages/MyPlaylistsPage/MyPlaylistsPage.tsx';
import TagManager from 'react-gtm-module';
import { SourceProvider } from './contexts/SourceContext';

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
			},
			{
				path: 'song/:id',
				loader: songLoader,
				element: <SongPage />,
			},
			{
				path: 'song/cached/:id',
				loader: cachedSongLoader,
				element: <CachedSongPage />,
			},
			{
				path: 'my-songs',
				loader: mySongsLoader,
				element: <MySongsPage />,
			},
			{
				path: 'song/edit/:id',
				loader: editSongPageLoader,
				element: <EditSongPage />,
			},
			{
				path: 'song/create',
				element: <CreateSongPage />,
			},
			{
				path: 'starred',
				loader: starredPageLoader,
				element: <StarredPage />,
			},
			{
				path: 'my-playlists',
				loader: myPlaylistsPageLoader,
				element: <MyPlaylistsPage />,
			},
			{
				path: 'playlist/:id',
				loader: playlistPageLoader,
				element: <PlaylistPage />,
			},
			{
				path: '/search',
				element: <SearchPage />,
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
		<MantineProvider
			theme={{
				primaryColor: 'gray',
			}}
		>
			<ModalsProvider>
				<Notifications position="top-right" />
				<AuthProvider>
					<SourceProvider>
						<Suspense fallback={<div>Loading...</div>}>
							<RouterProvider router={router} />
						</Suspense>
					</SourceProvider>
				</AuthProvider>
			</ModalsProvider>
		</MantineProvider>
	</StrictMode>,
);
