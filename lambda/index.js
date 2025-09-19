import { HttpError } from './utils/classes.js';
import { getSongFromPage, jsonResp } from './utils/functions.js';
import { readCache, writeCache } from './cache.js';
import { SOURCE_URL, REDIRECT_URL } from './utils/constants.js';

export const handler = async (event = {}) => {
	try {
		const path = event.rawPath || '';
		const songId = path.startsWith('/') ? path.slice(1) : path;

		if (!songId) throw new HttpError(400, 'No song specified');

		const fetchUrl = SOURCE_URL + `/${songId}`;

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

		return {
			statusCode: 302,
			headers: {
				Location: `${REDIRECT_URL}/song/cached/${songId}`,
			},
		};
	} catch (err) {
		console.error(err);

		const status = err instanceof HttpError ? err.statusCode : 500;
		const msg = err instanceof HttpError ? err.message : 'Internal error';

		return jsonResp(status, { error: msg });
	}
};
