import axios, { type AxiosInstance } from 'axios';
import { userManager } from '../AuthProvider';
import { API_URL } from '../constants/api.ts';
import { showNotification } from '@mantine/notifications';

let refreshPromise: Promise<void> | null = null;

const refreshToken = async (): Promise<void> => {
	if (refreshPromise) {
		return refreshPromise;
	}

	refreshPromise = (async () => {
		try {
			await userManager.signinSilent();
		} catch (err) {
			console.error('Token refresh failed:', err);
		} finally {
			refreshPromise = null;
		}
	})();

	return refreshPromise;
};

export const myFetch = async (): Promise<AxiosInstance> => {
	const user = await userManager.getUser();

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	};

	if (user?.id_token) {
		headers['Authorization'] = `Bearer ${user.id_token}`;
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
					// Wait for token refresh to complete
					await refreshToken();

					// Get the refreshed user
					const refreshedUser = await userManager.getUser();

					// Update the authorization header with the new token
					if (refreshedUser?.id_token) {
						originalRequest.headers['Authorization'] = `Bearer ${refreshedUser.id_token}`;
					}

					// Retry the original request with the new token
					return instance(originalRequest);
				} catch (refreshError) {
					console.error('Token refresh failed:', refreshError);
					// If refresh fails, redirect to login
					await userManager.signinRedirect();
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
};
