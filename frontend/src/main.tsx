import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components';
import { HomePage, CachedSongPage } from './pages';
import type { CachedSongDto } from './types';

const router = createBrowserRouter([
	{
		path: '/',
		element: <Layout />, // глобальный Layout
		children: [
			{
				index: true,
				element: <HomePage />,
			},
			{
				path: 'song/cached/:id',
				loader: async ({ params }): Promise<CachedSongDto> => {
					console.log("I'm here!");

					const fetchUrl = `${import.meta.env.VITE_API_URL}/api/cachedsong/${params.id}`;

					console.log('fetchUrl: ', fetchUrl);
					const res = await fetch(fetchUrl);

					if (!res.ok) {
						throw new Response('Not found', { status: 404 });
					}

					const test = await res.json();

					console.log('res.json(): ', test);

					return test;
				},
				element: <CachedSongPage />,
			},
		],
	},
]);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Suspense fallback={<div>Loading...</div>}>
			<RouterProvider router={router} />
		</Suspense>
	</StrictMode>,
);
