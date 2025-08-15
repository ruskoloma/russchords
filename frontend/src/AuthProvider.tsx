import React, { type ReactNode } from 'react';
import { AuthProvider as OidcProvider } from 'react-oidc-context';
import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

const settings = {
	authority: import.meta.env.VITE_COGNITO_AUTHORITY,
	client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
	redirect_uri: import.meta.env.VITE_COGNITO_REDIRECT_URI,
	post_logout_redirect_uri: import.meta.env.VITE_COGNITO_LOGOUT_URI,
	response_type: 'code',
	scope: import.meta.env.VITE_COGNITO_SCOPE,
	userStore: new WebStorageStateStore({ store: window.localStorage }),
	automaticSilentRenew: true,
	silent_redirect_uri: import.meta.env.VITE_COGNITO_SILENT_REDIRECT_URI,
	revokeTokensOnSignout: true,
};

// eslint-disable-next-line react-refresh/only-export-components
export const userManager = new UserManager(settings);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	return (
		<OidcProvider
			userManager={userManager}
			onSigninCallback={async () => {
				await userManager.signinCallback();
				window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
			}}
		>
			{children}
		</OidcProvider>
	);
};
