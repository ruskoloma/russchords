import { type LoaderFunction, redirect } from 'react-router-dom';
import type { LiteSongDto } from '../../types';
import { myFetch } from '../../helpers/api';
import axios from 'axios';

export const mySongsLoader: LoaderFunction = async () => {
	try {
		const client = await myFetch();
		const res = await client.get<LiteSongDto[]>('/song/my/light');
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
