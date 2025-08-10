import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@mantine/core/styles.css';
import 'mantine-datatable/styles.layer.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components';
import {
	cachedSongLoader,
	CachedSongPage,
	HomePage,
	myPlaylistsPageLoader,
	PlaylistPage,
	playlistPageLoader,
	songLoader,
	SongPage,
	StarredPage,
	starredPageLoader,
	MySongsPage,
	mySongsLoader,
} from './pages';
import { MantineProvider } from '@mantine/core';
import { AuthProvider } from './AuthProvider.tsx';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { ModalsProvider } from '@mantine/modals';
import MyPlaylistsPage from './pages/MyPlaylistsPage/MyPlaylistsPage.tsx';

const router = createBrowserRouter([
	{
		path: '/',
		element: <Layout />,
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
					<Suspense fallback={<div>Loading...</div>}>
						<RouterProvider router={router} />
					</Suspense>
				</AuthProvider>
			</ModalsProvider>
		</MantineProvider>
	</StrictMode>,
);
