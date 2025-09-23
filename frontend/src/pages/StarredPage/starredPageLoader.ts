import { type LoaderFunction, redirect } from 'react-router-dom';
import type { SongDto } from '../../types';
import { myFetch } from '../../helpers/api';
import axios from 'axios';

export const starredPageLoader: LoaderFunction = async () => {
	try {
		const client = await myFetch();
		const res = await client.get<SongDto[]>('/starred/my');
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
