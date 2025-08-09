import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@mantine/core/styles.css';
import 'mantine-datatable/styles.layer.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components';
import { CachedSongPage, HomePage, songLoader, cachedSongLoader, SongPage } from './pages';
import { MantineProvider } from '@mantine/core';
import { AuthProvider } from './AuthProvider.tsx';
import { MySongsPage } from './pages/MySongsPage/MySongsPage.tsx';
import { mySongsLoader } from './pages/MySongsPage/mySongsLoader.ts';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { ModalsProvider } from '@mantine/modals';

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
