import React, { type ReactNode } from 'react';
import { AuthProvider as Provider } from 'react-oidc-context';
import { UserManager } from 'oidc-client-ts';

const cognitoAuthConfig = {
	authority: import.meta.env.VITE_COGNITO_AUTHORITY,
	client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
	redirect_uri: import.meta.env.VITE_COGNITO_REDIRECT_URI,
	response_type: 'code',
	scope: import.meta.env.VITE_COGNITO_SCOPE,
};

// eslint-disable-next-line react-refresh/only-export-components
export const userManager = new UserManager(cognitoAuthConfig);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	return <Provider {...cognitoAuthConfig}>{children}</Provider>;
};
