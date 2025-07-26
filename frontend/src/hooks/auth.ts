import { useAuth } from 'react-oidc-context';

export function useAuthActions() {
	const auth = useAuth();

	const login = () => {
		auth.signinRedirect();
	};

	const logout = () => {
		const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
		const logoutUri = import.meta.env.VITE_COGNITO_LOGOUT_URI;
		const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN;

		window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
	};

	return { login, logout };
}
