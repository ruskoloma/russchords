import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { MrBeanLoader } from '../../components';

type UserState = {
	returnTo?: string;
};

export const AuthCallback = () => {
	const auth = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (auth.isLoading) return;

		if (auth.error) {
			console.error('Auth error:', auth.error);
			return;
		}

		if (auth.isAuthenticated) {
			let returnTo = '/';

			const stateFromUser = auth.user?.state as UserState | undefined;
			if (stateFromUser?.returnTo) {
				returnTo = stateFromUser.returnTo;
			} else {
				try {
					const params = new URLSearchParams(window.location.search);
					const state = params.get('state');
					if (state) {
						const parsed = JSON.parse(atob(state));
						if (parsed.returnTo) {
							returnTo = parsed.returnTo as string;
						}
					}
				} catch (e) {
					console.warn('Failed to parse state', e);
				}
			}
			navigate(returnTo, { replace: true });
		}
	}, [auth.isLoading, auth.error, auth.isAuthenticated]);

	return <MrBeanLoader />;
};
