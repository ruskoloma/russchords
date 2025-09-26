import { useEffect } from 'react';
import { userManager } from '../../AuthProvider';

export const SilentRedirect = () => {
	useEffect(() => {
		(async () => {
			try {
				await userManager.signinSilentCallback();

				const clean = window.location.origin + window.location.pathname;
				window.history.replaceState({}, document.title, clean);
			} catch (err) {
				console.error('[SilentRedirect] signinSilentCallback error:', err);
			} finally {
				if (window.self !== window.top) {
					window.close();
				}
			}
		})();
	}, []);

	return null;
};
