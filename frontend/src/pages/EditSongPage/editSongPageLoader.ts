import type { LoaderFunction } from 'react-router-dom';
import { redirect } from 'react-router-dom';
import axios from 'axios';
import { myFetch } from '../../helpers/api';
import type { SongDto } from '../../types';

export const editSongPageLoader: LoaderFunction = async ({ params }) => {
	try {
		const client = await myFetch();
		const res = await client.get<SongDto>(`/song/${params.id}`);
		return res.data;
	} catch (err) {
		if (axios.isAxiosError(err)) {
			const status = err.response?.status;
			if (status === 401) return redirect('/login');
			if (status === 404) throw new Response('Not found', { status: 404 });
		}
		throw err;
	}
};
