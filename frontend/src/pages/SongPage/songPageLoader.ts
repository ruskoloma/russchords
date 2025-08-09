import { type LoaderFunction } from 'react-router-dom';
import type { SongDto } from '../../types';
import { myFetch } from '../../helpers/api';

export const songLoader: LoaderFunction = async ({ params }) => {
	try {
		const client = await myFetch();

		// FIXME: delete song and externalRequest fields
		const res = await client.get<{ song: SongDto }>(`/api/song/${params.id}`);
		console.log('res.data >>>', res.data);
		return res.data.song;
	} catch (err) {
		console.error(err);
		throw new Response('Not found', { status: 404 });
	}
};
