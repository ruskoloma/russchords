import { MutationCache, QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import { del, get, set } from 'idb-keyval';
import { notifications } from '@mantine/notifications';
import { isApiError } from '../api/client';
import { readStoredUser } from '../auth/userManager';

declare module '@tanstack/react-query' {
	interface Register {
		queryMeta: {
			/** Set to false to keep a query out of the offline cache. */
			persist?: boolean;
		};
		mutationMeta: {
			/** Title of the error notification. Set `silent` to suppress it. */
			errorTitle?: string;
			silent?: boolean;
		};
	}
}

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Data is shown from cache instantly and refreshed in the background.
			staleTime: 30_000,
			gcTime: 1000 * 60 * 60 * 24 * 7,
			refetchOnWindowFocus: true,
			retry: (failureCount, error) => {
				if (isApiError(error) && [400, 401, 403, 404].includes(error.status)) return false;
				return failureCount < 2;
			},
		},
		mutations: {
			// Fail fast with "You are offline" instead of silently pausing a save;
			// editors keep a local draft, so nothing is lost.
			networkMode: 'always',
		},
	},
	mutationCache: new MutationCache({
		onError: (error, _vars, _ctx, mutation) => {
			if (mutation.meta?.silent) return;
			notifications.show({
				color: 'red',
				title: mutation.meta?.errorTitle ?? 'Something went wrong',
				message: error instanceof Error ? error.message : String(error),
			});
		},
	}),
});

// ---------------------------------------------------------------------------
// Offline cache: songs and playlists are persisted to IndexedDB so the app
// opens instantly (and works on a flaky church Wi-Fi). Everything is
// revalidated against the server in the background after restore.
// ---------------------------------------------------------------------------

const CACHE_KEY = 'russchords-query-cache';
const CACHE_VERSION = 'v1';

const safeIdb = {
	getItem: async (key: string) => {
		try {
			return (await get<string>(key)) ?? null;
		} catch {
			return null;
		}
	},
	setItem: async (key: string, value: string) => {
		try {
			await set(key, value);
		} catch {
			// IndexedDB unavailable (private mode) — run without offline cache.
		}
	},
	removeItem: async (key: string) => {
		try {
			await del(key);
		} catch {
			// ignore
		}
	},
};

const persister = createAsyncStoragePersister({
	storage: safeIdb,
	key: CACHE_KEY,
	throttleTime: 1000,
});

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
	persister,
	maxAge: 1000 * 60 * 60 * 24 * 7,
	// Cached data belongs to one user: a different (or no) user discards it.
	buster: `${CACHE_VERSION}:${readStoredUser()?.sub ?? 'anonymous'}`,
	dehydrateOptions: {
		shouldDehydrateQuery: (query) => query.state.status === 'success' && query.meta?.persist !== false,
	},
};

/** Drops all cached server data (memory + IndexedDB). Used on sign-out. */
export async function clearQueryCache() {
	queryClient.clear();
	await safeIdb.removeItem(CACHE_KEY);
}
