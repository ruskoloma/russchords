import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { showNotification } from '@mantine/notifications';
import { userManager } from '../AuthProvider';
import { API_URL } from '../constants/api.ts';

/**
 * Single module-level axios client for every frontend → backend call.
 *
 * Previous design:
 *   - `hooks/api.ts` → `useMyFetch()` created a *new* axios instance on every
 *     render, which rebuilt fetchers for every SWR hook consumer and cascaded
 *     re-renders across the app. This was the biggest perf regression source
 *     identified in the refactor audit.
 *   - `helpers/api.ts` → `myFetch()` also created a new instance per call,
 *     just from loaders.
 *
 * Current design:
 *   - One shared `apiClient` for the whole app. Stable reference across
 *     renders, so SWR fetcher identity is stable and hooks don't recompute.
 *   - The request interceptor reads the ID token *lazily* from `userManager`
 *     on every request, so tokens are always fresh without needing the hook.
 *   - The response interceptor handles 401 → silent-refresh → retry, and
 *     surfaces non-auth errors via `showNotification` (same UX as before).
 *   - `myFetch()` is kept as a thin async wrapper so existing loaders keep
 *     compiling unchanged; it simply resolves to `apiClient`. Prefer importing
 *     `apiClient` directly in new code.
 */

let refreshPromise: Promise<void> | null = null;

async function refreshToken(): Promise<void> {
	if (refreshPromise) return refreshPromise;
	refreshPromise = (async () => {
		try {
			await userManager.signinSilent();
		} catch (err) {
			console.error('[api] silent refresh failed:', err);
			throw err;
		} finally {
			refreshPromise = null;
		}
	})();
	return refreshPromise;
}

export const apiClient: AxiosInstance = axios.create({
	baseURL: API_URL,
	headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
	try {
		const user = await userManager.getUser();
		if (user?.id_token && !user.expired) {
			config.headers.set('Authorization', `Bearer ${user.id_token}`);
		} else {
			config.headers.delete('Authorization');
		}
	} catch (err) {
		// Reading the user from storage should never throw, but log defensively
		// so a corrupt storage entry can't silently break every request.
		console.error('[api] failed to read user before request:', err);
	}
	return config;
});

apiClient.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const original = error.config as
			| (InternalAxiosRequestConfig & { _retry?: boolean })
			| undefined;

		// 401 → try a silent refresh, then retry the original request exactly once.
		if (error.response?.status === 401 && original && !original._retry) {
			original._retry = true;
			try {
				await refreshToken();
				const refreshed = await userManager.getUser();
				if (refreshed?.id_token) {
					original.headers.set('Authorization', `Bearer ${refreshed.id_token}`);
				}
				return apiClient.request(original);
			} catch (refreshErr) {
				console.error('[api] token refresh failed:', refreshErr);
				await userManager.signinRedirect();
				return Promise.reject(refreshErr);
			}
		}

		const data = error.response?.data as { message?: string } | undefined;
		const message = data?.message || error.response?.statusText || 'Unexpected error occurred';
		console.error('[api]', message);
		showNotification({
			title: 'Error',
			message,
			color: 'red',
		});
		return Promise.reject(error);
	},
);

/**
 * Backwards-compatible async wrapper used by router loaders that were written
 * against the previous `myFetch()` signature. Always resolves to `apiClient`
 * — no per-call instantiation, no token baking.
 */
export const myFetch = async (): Promise<AxiosInstance> => apiClient;
