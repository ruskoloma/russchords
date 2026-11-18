import { createBrowserRouter, redirect, type LoaderFunctionArgs } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { RouteError } from '../components/RouteError';
import { NotFound } from '../components/NotFound';
import { HomePage } from '../pages/HomePage';
import { AuthCallbackPage, SilentCallbackPage } from '../pages/AuthPages';
import { queryClient } from './queryClient';
import { songQuery, mySongsQuery } from '../api/songs';
import { starredQuery } from '../api/starred';
import { myPlaylistsQuery, playlistQuery } from '../api/playlists';
import { cachedSongQuery } from '../api/holychords';
import { hasUsableStoredSession } from '../auth/userManager';

/**
 * Route loaders only *start* fetching (in parallel with the lazy page chunk)
 * and never block navigation: pages render immediately from cache or with a
 * skeleton, and TanStack Query owns the data.
 */
const prefetch =
	(fn: (args: LoaderFunctionArgs) => unknown) =>
	(args: LoaderFunctionArgs): null => {
		try {
			void Promise.resolve(fn(args)).catch(() => {});
		} catch {
			// prefetching is best-effort
		}
		return null;
	};

const idParam = (args: LoaderFunctionArgs) => Number(args.params.id);
const signedIn = () => hasUsableStoredSession();

export const router = createBrowserRouter([
	{
		path: '/auth/silent-callback',
		element: <SilentCallbackPage />,
	},
	{
		path: '/',
		element: <AppLayout />,
		errorElement: <RouteError />,
		children: [
			{
				errorElement: <RouteError />,
				children: [
					{ index: true, element: <HomePage />, handle: { maxWidth: 960 } },
					{ path: 'auth/callback', element: <AuthCallbackPage /> },
					{
						path: 'search',
						handle: { maxWidth: 880 },
						lazy: async () => ({ Component: (await import('../pages/SearchPage')).SearchPage }),
					},
					{
						path: 'song/create',
						handle: { maxWidth: 1320 },
						lazy: async () => ({ Component: (await import('../pages/SongEditorPage')).CreateSongPage }),
					},
					{
						path: 'song/edit/:id',
						handle: { maxWidth: 1320 },
						loader: prefetch((a) => queryClient.prefetchQuery(songQuery(idParam(a)))),
						lazy: async () => ({ Component: (await import('../pages/SongEditorPage')).EditSongPage }),
					},
					{
						path: 'song/cached/:id',
						handle: { maxWidth: 880 },
						loader: prefetch((a) => queryClient.prefetchQuery(cachedSongQuery(String(a.params.id)))),
						lazy: async () => ({ Component: (await import('../pages/CachedSongPage')).CachedSongPage }),
					},
					{
						path: 'song/:id',
						handle: { maxWidth: 880 },
						loader: prefetch((a) => queryClient.prefetchQuery(songQuery(idParam(a)))),
						lazy: async () => ({ Component: (await import('../pages/SongPage')).SongPage }),
					},
					{
						path: 'my-songs',
						handle: { maxWidth: 960 },
						loader: prefetch(() => signedIn() && queryClient.prefetchQuery(mySongsQuery())),
						lazy: async () => ({ Component: (await import('../pages/MySongsPage')).MySongsPage }),
					},
					{
						path: 'starred',
						handle: { maxWidth: 960 },
						loader: prefetch(() => signedIn() && queryClient.prefetchQuery(starredQuery())),
						lazy: async () => ({ Component: (await import('../pages/StarredPage')).StarredPage }),
					},
					{
						path: 'my-playlists',
						handle: { maxWidth: 1120 },
						loader: prefetch(() => signedIn() && queryClient.prefetchQuery(myPlaylistsQuery())),
						lazy: async () => ({ Component: (await import('../pages/PlaylistsPage')).PlaylistsPage }),
					},
					{
						path: 'playlist/:id',
						handle: { maxWidth: 880 },
						loader: prefetch((a) => queryClient.prefetchQuery(playlistQuery(idParam(a)))),
						lazy: async () => ({ Component: (await import('../pages/PlaylistPage')).PlaylistPage }),
					},
					{
						path: 'playlist/:id/stage',
						handle: { immersive: true },
						loader: prefetch((a) => queryClient.prefetchQuery(playlistQuery(idParam(a)))),
						lazy: async () => ({ Component: (await import('../pages/StagePage')).StagePage }),
					},
					{
						// Old "play mode" URL (bookmarks, home-screen shortcuts).
						path: 'playlist/:id/play',
						loader: ({ params }) => redirect(`/playlist/${params.id}/stage`),
					},
					{ path: '*', element: <NotFound /> },
				],
			},
		],
	},
]);
