import { clearQueryCache } from '../app/queryClient';
import { removeKeysWithPrefix } from '../lib/storage';
import { userManager } from './userManager';

export interface SignInState {
	returnTo?: string;
}

function currentLocation(): string {
	const { pathname, search, hash } = window.location;
	if (pathname.startsWith('/auth/')) return '/';
	return `${pathname}${search}${hash}`;
}

/** Only allow same-origin, in-app return paths. */
export function sanitizeReturnTo(value: unknown): string {
	if (typeof value !== 'string') return '/';
	if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/auth/')) return '/';
	return value;
}

/** Starts the hosted-UI sign-in and comes back to `returnTo` afterwards. */
export async function signIn(returnTo: string = currentLocation()) {
	const state: SignInState = { returnTo: sanitizeReturnTo(returnTo) };
	try {
		await userManager.signinRedirect({ state });
	} catch (err) {
		// Stale OIDC state (e.g. after an authority change) — drop it and retry once.
		console.warn('[auth] sign-in failed, clearing stale OIDC state and retrying', err);
		removeKeysWithPrefix('oidc.');
		await userManager.signinRedirect({ state });
	}
}

/** Ends the session locally (cache, drafts, tokens) and at Cognito. */
export async function signOut() {
	await clearQueryCache();
	removeKeysWithPrefix('russchords:draft:');
	try {
		// Legacy service-worker API cache from earlier app versions.
		if ('caches' in window) await caches.delete('russchords-api-cache');
	} catch {
		// ignore
	}
	await userManager.removeUser();

	const env = import.meta.env;
	const url =
		`https://${env.VITE_COGNITO_DOMAIN}/logout?` +
		`client_id=${encodeURIComponent(env.VITE_COGNITO_CLIENT_ID)}&` +
		`logout_uri=${encodeURIComponent(env.VITE_COGNITO_LOGOUT_URI)}`;
	window.location.assign(url);
}
