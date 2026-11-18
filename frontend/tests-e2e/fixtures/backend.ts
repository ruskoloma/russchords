import type { Page } from '@playwright/test';

interface Song {
	id: number;
	name: string;
	artist: string | null;
	content: string;
	rootNote: string | null;
	authorId: string;
	tags: string[];
}

const LONG_SONG = Array.from({ length: 40 }, (_, i) => `Verse ${i + 1}:\nC G Am F\nLyrics line ${i + 1}`).join('\n\n');

/** Tiny stateful backend so writes are reflected in later reads. */
export async function mockBackend(page: Page) {
	const songs: Song[] = [1, 2, 3].map((id) => ({
		id,
		name: `Song ${id}`,
		artist: null,
		content: id === 1 ? LONG_SONG : 'Verse:\nC G\nLyrics line',
		rootNote: 'C',
		authorId: 'user-1',
		tags: [],
	}));
	const playlist = {
		playlistId: 10,
		ownerId: 'user-1',
		title: 'Sunday',
		description: '',
		isPinned: false,
		memberRecordId: 1,
		songIds: [1, 2, 3],
	};
	const lite = (s: Song) => ({ id: s.id, name: s.name, artist: s.artist, rootNote: s.rootNote, tags: s.tags });
	const playlistDto = () => ({
		...playlist,
		songs: playlist.songIds.map((id) => lite(songs.find((s) => s.id === id)!)),
	});

	await page.route(/\/mock-api\//, async (route) => {
		const req = route.request();
		const path = new URL(req.url()).pathname.replace(/^.*\/mock-api/, '');
		const method = req.method();
		const json = (body: unknown) =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
		let m: RegExpMatchArray | null;
		if (method === 'GET' && path === '/song/my/light') return json(songs.map(lite));
		if (method === 'GET' && (m = path.match(/^\/song\/(\d+)$/))) return json(songs.find((s) => s.id === Number(m![1])));
		if (method === 'PUT' && (m = path.match(/^\/song\/(\d+)$/))) {
			Object.assign(songs.find((s) => s.id === Number(m![1]))!, req.postDataJSON());
			return route.fulfill({ status: 204 });
		}
		if (method === 'GET' && path === '/starred/my') return json([]);
		if (method === 'GET' && path === '/playlist/my') return json([playlistDto()]);
		if (method === 'GET' && path === '/playlist/10') return json(playlistDto());
		if (method === 'PUT' && path === '/playlist/10') return route.fulfill({ status: 204 });
		if ((m = path.match(/^\/playlist\/10\/songs\/(\d+)$/))) {
			const id = Number(m[1]);
			playlist.songIds =
				method === 'POST'
					? [...playlist.songIds.filter((x) => x !== id), id]
					: playlist.songIds.filter((x) => x !== id);
			return route.fulfill({ status: 204 });
		}
		if (method === 'POST' && path === '/playlist/10/reorder') {
			playlist.songIds = req.postDataJSON().songIds;
			return route.fulfill({ status: 204 });
		}
		return route.fulfill({ status: 500, body: `unmocked ${method} ${path}` });
	});
	return { songs, playlist };
}

