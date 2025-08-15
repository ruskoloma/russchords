import { useAuth } from 'react-oidc-context';

export function useAuthActions() {
	const auth = useAuth();

	const login = () => auth.signinRedirect();

	const logout = () => auth.signoutRedirect();

	return { login, logout };
}
