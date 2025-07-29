import type { LoaderFunction } from 'react-router-dom';
import type { CachedSongDto } from '../../types';
import { API_URL } from '../../constants/api.ts';

export const cachedSongLoader: LoaderFunction = async ({ params }) => {
	const fetchUrl = `${API_URL}/api/cachedsong/${params.id}`;
	const res = await fetch(fetchUrl);

	if (!res.ok) {
		throw new Response('Not found', { status: 404 });
	}

	return res.json() as Promise<CachedSongDto>;
};
