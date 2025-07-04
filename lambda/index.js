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

		let song =
			(await readCache(songId)) ||
			(await getSongFromPage(SOURCE_URL + songId));

		if (!song) throw new HttpError(404, 'Not found');

		console.log(`Song ID: ${songId}`);
		console.log(`Song Name: ${song.name}`);
		console.log(`Lyrics: ${song.content}`);

		await writeCache(songId, song);

		return jsonResp(200, {
			name: song.name,
			content: song.content,
		});
	} catch (err) {
		console.error(err);

		const status = err instanceof HttpError ? err.statusCode : 500;
		const msg = err instanceof HttpError ? err.message : 'Internal error';

		return jsonResp(status, { error: msg });
	}
};