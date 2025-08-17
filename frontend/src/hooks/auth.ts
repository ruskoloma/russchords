import { useAuth } from 'react-oidc-context';

export function useAuthActions() {
	const auth = useAuth();

	const login = async () => {
		try {
			await auth.signinRedirect({ state: { returnTo: location.pathname } });
		} catch (error) {
			if (error instanceof Error && error.message.includes('authority mismatch on settings vs. signin state')) {
				console.warn('Authority mismatch detected. Clearing storage and retrying login.');
				window.localStorage.clear(); // Или selectively: auth.removeUser();
				await auth.signinRedirect({ state: { returnTo: location.pathname } });
			} else {
				throw error; // Другие ошибки пробрасываем
			}
		}
	};

	const logout = async () => {
		await auth.removeUser();

		const logoutUrl =
			`${import.meta.env.VITE_COGNITO_DOMAIN}/logout?` +
			`client_id=${import.meta.env.VITE_COGNITO_CLIENT_ID}&` +
			`logout_uri=${encodeURIComponent(import.meta.env.VITE_COGNITO_LOGOUT_URI)}`;

		window.location.href = logoutUrl;
	};

	return { login, logout };
}
