import { useMemo } from 'react';
import { useAuth } from 'react-oidc-context';
import { hasUsableStoredSession } from './userManager';

export interface Session {
	/** True until the OIDC provider has read the stored session. */
	isLoading: boolean;
	/** Signed in with a valid or renewable session. */
	isSignedIn: boolean;
	userId: string | null;
	displayName: string | null;
	email: string | null;
}

/**
 * App-level view of the auth state.
 *
 * Unlike `useAuth().isAuthenticated`, a session whose ID token has expired
 * but which still holds a refresh token counts as signed in: the API layer
 * renews it transparently on the next request. This avoids the UI flashing
 * "Sign in" after a phone wakes up with a stale token.
 */
export function useSession(): Session {
	const auth = useAuth();
	const user = auth.user;

	return useMemo(() => {
		if (auth.isLoading) {
			// Read synchronously so the first paint already has the right UI.
			return {
				isLoading: true,
				isSignedIn: hasUsableStoredSession(),
				userId: null,
				displayName: null,
				email: null,
			};
		}
		const isSignedIn = Boolean(user && (!user.expired || user.refresh_token));
		const profile = user?.profile;
		const nickname = typeof profile?.nickname === 'string' ? profile.nickname : null;
		const email = typeof profile?.email === 'string' ? profile.email : null;
		return {
			isLoading: false,
			isSignedIn,
			userId: isSignedIn ? (profile?.sub ?? null) : null,
			displayName: isSignedIn ? (nickname ?? email) : null,
			email: isSignedIn ? email : null,
		};
	}, [auth.isLoading, user]);
}
