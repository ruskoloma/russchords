import React, { type ReactNode } from 'react';
import { AuthProvider as OidcProvider } from 'react-oidc-context';
import { UserManager, type UserManagerSettings, WebStorageStateStore } from 'oidc-client-ts';

const settings: UserManagerSettings = {
	authority: import.meta.env.VITE_COGNITO_AUTHORITY,
	client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
	redirect_uri: import.meta.env.VITE_COGNITO_REDIRECT_URI,
	post_logout_redirect_uri: import.meta.env.VITE_COGNITO_LOGOUT_URI,
	response_type: 'code',
	response_mode: 'query',
	scope: import.meta.env.VITE_COGNITO_SCOPE,
	userStore: new WebStorageStateStore({ store: window.localStorage }),
	automaticSilentRenew: true,
	silent_redirect_uri: import.meta.env.VITE_COGNITO_SILENT_REDIRECT_URI,
	revokeTokensOnSignout: false,
};

// eslint-disable-next-line react-refresh/only-export-components
export const userManager = new UserManager(settings);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	return (
		<OidcProvider
			userManager={userManager}
			onSigninCallback={async () => {
				try {
					await userManager.signinCallback();
				} catch (err: unknown) {
					const msg = err instanceof Error ? err.message : String(err);
					if (msg.includes('No matching state found in storage')) {
						console.warn('Callback without stored state; ignoring');
					} else {
						console.error('signinCallback error:', err);
					}
				} finally {
					window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
				}
			}}
		>
			{children}
		</OidcProvider>
	);
};
