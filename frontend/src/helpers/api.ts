import axios from 'axios';
import { userManager } from '../AuthProvider';
import { API_URL } from '../constants/api.ts';
import { showNotification } from '@mantine/notifications';

export const myFetch = async () => {
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
		(error) => {
			const message = error.response?.data?.message || error.response?.statusText || 'Unexpected error occurred';

			console.error(message);

			// TODO: use mantine notification
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
