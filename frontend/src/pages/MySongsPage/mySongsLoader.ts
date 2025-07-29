import { API_URL } from '../../constants/api.ts';
import { redirect, type LoaderFunction } from 'react-router-dom';
import type { SongDto } from '../../types';
import { userManager } from '../../AuthProvider.tsx';

export const mySongsLoader: LoaderFunction = async () => {
	const user = await userManager.getUser();

	if (!user) {
		return redirect('/login');
	}
	const res = await fetch(`${API_URL}/api/Song/my`, {
		headers: {
			Authorization: `Bearer ${user.id_token}`,
		},
	});

	if (!res.ok) {
		throw new Response('Failed to fetch my songs', { status: res.status });
	}

	return res.json() as Promise<SongDto[]>;
};
