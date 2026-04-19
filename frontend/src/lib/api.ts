import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { showNotification } from '@mantine/notifications';
import { userManager } from '../AuthProvider';

const API_URL = import.meta.env.VITE_API_URL;

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

/**
 * Request interceptor — attaches the ID token synchronously from the
 * in-memory user store. Key insight: `userManager.getUser()` is async
 * because it reads from the configured `userStore` (localStorage), and
 * `oidc-client-ts` internally checks expiry and may trigger a silent
 * renew before resolving. That silent renew round-trips to Cognito via
 * an iframe and can block for 2–5 seconds — which is why the first
 * authenticated page load (e.g. My Songs) felt painfully slow.
 *
 * Fix: read the stored user object directly from localStorage (pure
 * sync, ~0ms) and attach whatever token is there — even if technically
 * expired. If the backend rejects it with a 401, the *response*
 * interceptor below already handles silent refresh + retry. This way
 * the common case (valid token) fires instantly, and the uncommon case
 * (expired token) still works via one extra round-trip instead of
 * pre-emptively blocking every single request.
 */
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
	try {
		// `oidc-client-ts` stores the user JSON under a key like
		// `oidc.user:<authority>:<client_id>` in the configured store.
		const storageKey = `oidc.user:${import.meta.env.VITE_COGNITO_AUTHORITY}:${import.meta.env.VITE_COGNITO_CLIENT_ID}`;
		const raw = localStorage.getItem(storageKey);
		if (raw) {
			const stored = JSON.parse(raw) as { id_token?: string };
			if (stored.id_token) {
				config.headers.set('Authorization', `Bearer ${stored.id_token}`);
			}
		}
	} catch {
		// localStorage read or JSON parse failed — proceed without token.
		// The response interceptor will handle the 401.
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
