import { type LoaderFunction } from 'react-router-dom';
import type { CachedSongDto } from '../../types';
import { myFetch } from '../../helpers/api';

export const cachedSongLoader: LoaderFunction = async ({ params }) => {
	try {
		const client = await myFetch();
		const res = await client.get<CachedSongDto>(`/api/cachedsong/${params.id}`);
		return res.data;
	} catch (err) {
		console.error(err);
		throw new Response('Not found', { status: 404 });
	}
};
