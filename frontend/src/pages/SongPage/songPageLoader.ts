import { type LoaderFunction } from 'react-router-dom';
import type { SongDto } from '../../types';
import { myFetch } from '../../helpers/api';

export const songLoader: LoaderFunction = async ({ params }) => {
	try {
		const client = await myFetch();

		const res = await client.get<SongDto>(`/song/${params.id}`);
		return res.data;
	} catch (err) {
		console.error(err);
		throw new Response('Not found', { status: 404 });
	}
};
