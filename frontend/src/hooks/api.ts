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
		(error) => {
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
