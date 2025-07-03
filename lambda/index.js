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

		// TODO: add tone as an anchor and check on ad (url.hash.substring(0, url.hash.indexOf("?"));)

		const lyrics =
			(await readCache(songId)) || (await getSongFromPage(SOURCE_URL + songId));

		if (!lyrics) throw new HttpError(404, 'Not found');

		console.log(`Song ID: ${songId}`);
		console.log(`Lyrics: ${lyrics}`);

		await writeCache(songId, lyrics);

		return jsonResp(200, { lyrics });
	} catch (err) {
		console.error(err);

		const status = err instanceof HttpError ? err.statusCode : 500;
		const msg = err instanceof HttpError ? err.message : 'Internal error';

		return jsonResp(status, { error: msg });
	}
};
