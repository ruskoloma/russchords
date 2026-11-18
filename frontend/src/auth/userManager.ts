import { UserManager, WebStorageStateStore, type UserManagerSettings } from 'oidc-client-ts';

const env = import.meta.env;

/** localStorage key oidc-client-ts uses for the signed-in user. */
export const OIDC_USER_KEY = `oidc.user:${env.VITE_COGNITO_AUTHORITY}:${env.VITE_COGNITO_CLIENT_ID}`;

const settings: UserManagerSettings = {
	authority: env.VITE_COGNITO_AUTHORITY,
	client_id: env.VITE_COGNITO_CLIENT_ID,
	redirect_uri: env.VITE_COGNITO_REDIRECT_URI,
	post_logout_redirect_uri: env.VITE_COGNITO_LOGOUT_URI,
	silent_redirect_uri: env.VITE_COGNITO_SILENT_REDIRECT_URI,
	response_type: 'code',
	scope: env.VITE_COGNITO_SCOPE,
	// Persist the session across tabs and browser restarts.
	userStore: new WebStorageStateStore({ store: window.localStorage }),
	// Renewal is owned by `session.ts` (single-flight, cross-tab locked,
	// refresh-token only). The built-in renewer can race with it and falls
	// back to a hidden iframe with prompt=none, which Cognito doesn't support.
	automaticSilentRenew: false,
	monitorSession: false,
	revokeTokensOnSignout: false,
	loadUserInfo: false,
	accessTokenExpiringNotificationTimeInSeconds: 120,
	silentRequestTimeoutInSeconds: 15,
};

export const userManager = new UserManager(settings);

/**
 * Synchronous peek at the stored session — used by route loaders and the
 * query-cache buster, which run before React (and the OIDC provider) mount.
 */
export function readStoredUser(): { sub?: string; expiresAt?: number; hasRefreshToken: boolean } | null {
	try {
		const raw = window.localStorage.getItem(OIDC_USER_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as {
			profile?: { sub?: string };
			expires_at?: number;
			refresh_token?: string;
		};
		return {
			sub: parsed.profile?.sub,
			expiresAt: parsed.expires_at,
			hasRefreshToken: Boolean(parsed.refresh_token),
		};
	} catch {
		return null;
	}
}

/** True when there's a session that is valid or can be renewed. */
export function hasUsableStoredSession(): boolean {
	const user = readStoredUser();
	if (!user) return false;
	if (user.hasRefreshToken) return true;
	return typeof user.expiresAt === 'number' && user.expiresAt * 1000 > Date.now();
}
