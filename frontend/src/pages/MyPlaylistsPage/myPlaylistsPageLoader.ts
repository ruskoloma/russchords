import { type LoaderFunction, redirect } from 'react-router-dom';
import axios from 'axios';
import { myFetch } from '../../helpers/api';
import type { MyPlaylistDto } from '../../types';

export const myPlaylistsPageLoader: LoaderFunction = async () => {
	try {
		const client = await myFetch();
		const res = await client.get<MyPlaylistDto[]>('/api/playlist/my');
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
