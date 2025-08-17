import { useAuth } from 'react-oidc-context';
import { useLocation } from 'react-router-dom';

export function useAuthActions() {
	const auth = useAuth();
	const location = useLocation();

	const login = () => {
		return auth.signinRedirect({
			state: { returnTo: location.pathname },
		});
	};

	const logout = () => auth.signoutRedirect();

	return { login, logout };
}
