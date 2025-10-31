import axios from 'axios';
import { useAuth } from 'react-oidc-context';
import { API_URL } from '../constants/api.ts';
import { showNotification } from '@mantine/notifications';

export function useMyFetch() {
	const auth = useAuth();

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	};

	if (auth.user?.id_token) {
		headers['Authorization'] = `Bearer ${auth.user.id_token}`;
	}

	const instance = axios.create({
		baseURL: API_URL,
		headers,
	});

	instance.interceptors.response.use(
		(response) => response,
		async (error) => {
			const originalRequest = error.config;

			// If we get a 401 and haven't already tried to refresh, attempt token refresh
			if (error.response?.status === 401 && !originalRequest._retry) {
				originalRequest._retry = true;

				try {
					// Attempt to get a fresh user (this will trigger automatic silent renew if needed)
					await auth.signinSilent();

					// Update the authorization header with the new token
					if (auth.user?.id_token) {
						originalRequest.headers['Authorization'] = `Bearer ${auth.user.id_token}`;
					}

					// Retry the original request with the new token
					return instance(originalRequest);
				} catch (refreshError) {
					console.error('Token refresh failed:', refreshError);
					// If refresh fails, redirect to login
					await auth.signinRedirect();
					return Promise.reject(refreshError);
				}
			}

			const message = error.response?.data?.message || error.response?.statusText || 'Unexpected error occurred';

			console.error(message);

			showNotification({
				title: 'Error',
				message,
				color: 'red',
			});

			return Promise.reject(error);
		},
	);

	return instance;
}
