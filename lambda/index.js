import { URL } from 'node:url';
import { HttpError } from './utils/classes.js';
import { getSongFromPage, jsonResp } from './utils/functions.js';
import { readCache, writeCache } from './cache.js';
import { SOURCE_URL } from './utils/constants.js';

export const handler = async (event = {}) => {
	try {
		const url = new URL(event.url);
		const songId = url.pathname.slice(1);

		if (!songId) throw new HttpError(400, 'No song specified');

		const fetchUrl = SOURCE_URL + songId;

		const cached = await readCache(songId);

		let song;

		if (cached) {
			song = cached;
			console.log(`Song loaded from cache: ${songId}`);
		} else {
			song = await getSongFromPage(fetchUrl);
			if (!song) throw new HttpError(404, 'Not found');

			console.log(`Song loaded from source: ${songId}`);

			await writeCache(songId, {
				...song,
				original_url: fetchUrl,
			});
		}

		console.log(`Song ID: ${songId}`);
		console.log(`Song Name: ${song.name}`);
		console.log(`Artist: ${song.artist}`);

		return jsonResp(200, {
			name: song.name,
			artist: song.artist,
			content: song.content,
			original_url: fetchUrl,
		});
	} catch (err) {
		console.error(err);

		const status = err instanceof HttpError ? err.statusCode : 500;
		const msg = err instanceof HttpError ? err.message : 'Internal error';

		return jsonResp(status, { error: msg });
	}
};