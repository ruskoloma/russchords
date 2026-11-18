import { ErrorResponse, type User } from 'oidc-client-ts';
import { OIDC_USER_KEY, userManager } from './userManager';

/**
 * Session lifecycle for the whole app.
 *
 * Cognito issues 60-minute ID tokens plus a 30-day refresh token. The rules:
 *
 *  - Tokens are renewed **only** with the refresh token, never through a
 *    hidden iframe (Cognito has no prompt=none support).
 *  - Renewal is single-flight per tab and serialized across tabs with the
 *    Web Locks API, so parallel requests or several open tabs never fire
 *    concurrent refreshes.
 *  - Network failures and server errors are transient: the stored session is kept and renewal
 *    is retried on the next request, when the tab becomes visible again, or
 *    when the device comes back online.
 *  - Only an explicit rejection by Cognito (e.g. `invalid_grant` after the
 *    refresh token expired) ends the session. Nothing ever redirects the
 *    user away automatically — they get a notification with a sign-in
 *    button instead, so unsaved work is never lost.
 *  - Sign-in/sign-out in one tab is mirrored to every other tab.
 */

/** Refresh when the token has less than this many seconds left. */
const MIN_VALIDITY_SECONDS = 90;
const LOCK_NAME = 'russchords-token-refresh';

type Listener = () => void;
const expiredListeners = new Set<Listener>();

/** Subscribe to "the session was rejected and has been removed". */
export function onSessionExpired(listener: Listener): () => void {
	expiredListeners.add(listener);
	return () => expiredListeners.delete(listener);
}

/**
 * Only an OAuth error returned by Cognito's token endpoint (e.g. `invalid_grant`
 * for an expired or revoked refresh token) means the session is over.
 * Network failures, timeouts and 5xx responses are treated as temporary.
 */
function isAuthRejection(err: unknown): boolean {
	return (
		err instanceof ErrorResponse &&
		Boolean(err.error) &&
		err.error !== 'server_error' &&
		err.error !== 'temporarily_unavailable'
	);
}

async function expireSession() {
	await userManager.removeUser();
	expiredListeners.forEach((l) => l());
}

async function withCrossTabLock<T>(fn: () => Promise<T>): Promise<T> {
	const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
	if (!locks?.request) return fn();
	return locks.request(LOCK_NAME, fn);
}

let inFlight: Promise<User | null> | null = null;

/**
 * Renews the session if needed and returns the (possibly new) user.
 *
 * Resolves `null` when there is no session or it was rejected. Rejects only
 * on transient errors — the stored session is left intact in that case.
 */
export function refreshSession(options: { force?: boolean } = {}): Promise<User | null> {
	if (inFlight) return inFlight;

	inFlight = withCrossTabLock(async () => {
		const current = await userManager.getUser();
		if (!current) return null;

		// Another tab may have refreshed while we waited for the lock.
		if (!options.force && !current.expired && (current.expires_in ?? 0) > MIN_VALIDITY_SECONDS) {
			return current;
		}

		if (!current.refresh_token) {
			if (!current.expired) return current;
			await expireSession();
			return null;
		}

		try {
			return await userManager.signinSilent();
		} catch (err) {
			if (!isAuthRejection(err)) throw err;
			console.warn('[session] refresh rejected, signing out locally', err);
			await expireSession();
			return null;
		}
	}).finally(() => {
		inFlight = null;
	});

	return inFlight;
}

/**
 * Returns an ID token for API calls, renewing it first when it is about to
 * expire. On transient renewal failures the old token is returned — the API
 * layer retries once more on a 401.
 */
export async function getIdToken(): Promise<string | null> {
	const user = await userManager.getUser();
	if (!user) return null;
	if (!user.expired && (user.expires_in ?? 0) > MIN_VALIDITY_SECONDS) {
		return user.id_token ?? null;
	}
	try {
		const renewed = await refreshSession();
		return renewed?.id_token ?? null;
	} catch {
		return user.id_token ?? null;
	}
}

let started = false;

/** Installs the background renewal triggers. Idempotent. */
export function startSessionKeeper() {
	if (started) return;
	started = true;

	const renewSoon = () => {
		void refreshSession().catch(() => {
			// transient — the next trigger retries
		});
	};

	// Timer-based: oidc-client-ts raises these from the stored expiry.
	userManager.events.addAccessTokenExpiring(renewSoon);
	userManager.events.addAccessTokenExpired(renewSoon);

	// Phones suspend timers while the screen is off: re-check on wake/online.
	const checkNow = async () => {
		const user = await userManager.getUser();
		if (user && (user.expired || (user.expires_in ?? 0) <= MIN_VALIDITY_SECONDS)) renewSoon();
	};
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') void checkNow();
	});
	window.addEventListener('online', () => void checkNow());

	// Mirror sign-in / sign-out / renewals performed in other tabs.
	window.addEventListener('storage', (e) => {
		if (e.key !== OIDC_USER_KEY) return;
		if (e.newValue == null) {
			void userManager.events.unload();
			return;
		}
		void userManager.getUser().then((user) => {
			if (user) void userManager.events.load(user);
		});
	});

	void checkNow();
}
