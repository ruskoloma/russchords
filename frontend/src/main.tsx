import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@mantine/core/styles.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components';
import { CachedSongPage, HomePage } from './pages';
import { cachedSongLoader } from './pages/CachedSongPage/cachedSongLoader.ts';
import { MantineProvider } from '@mantine/core';

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
				path: 'song/cached/:id',
				loader: cachedSongLoader,
				element: <CachedSongPage />,
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
			<Suspense fallback={<div>Loading...</div>}>
				<RouterProvider router={router} />
			</Suspense>
		</MantineProvider>
	</StrictMode>,
);
