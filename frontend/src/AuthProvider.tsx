import React, { type ReactNode } from 'react';
import { AuthProvider as Provider } from 'react-oidc-context';

const cognitoAuthConfig = {
	authority: import.meta.env.VITE_COGNITO_AUTHORITY,
	client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
	redirect_uri: import.meta.env.VITE_COGNITO_REDIRECT_URI,
	response_type: 'code',
	scope: import.meta.env.VITE_COGNITO_SCOPE,
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	return <Provider {...cognitoAuthConfig}>{children}</Provider>;
};
