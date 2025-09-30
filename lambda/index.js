import { HttpError } from './utils/classes.js';
import { getSongFromPage, jsonResp } from './utils/functions.js';
import { readCache, writeCache } from './cache.js';
import { SOURCE_URL, REDIRECT_URL } from './utils/constants.js';

export const handler = async (event = {}) => {
	try {
		const path = event.rawPath || '';
		const songId = path.startsWith('/') ? path.slice(1) : path;

		if (!songId) throw new HttpError(400, 'No song specified');

		// Check for query parameters
		const queryParams = event.queryStringParameters || {};
		const forceRefresh = queryParams.force_refresh === 'true';
		const clientMode = queryParams.client_mode === 'true';

		const fetchUrl = SOURCE_URL + `/${songId}`;

		let song;

		if (forceRefresh) {
			// Skip cache check and fetch directly from source
			console.log(`Force refresh requested, skipping cache for song: ${songId}`);
			song = await getSongFromPage(fetchUrl);
			if (!song) throw new HttpError(404, 'Not found');

			console.log(`Song loaded from source (force refresh): ${songId}`);

			// Update cache with fresh data
			await writeCache(songId, {
				...song,
				original_url: fetchUrl,
			});
		} else {
			// Normal flow: check cache first
			const cached = await readCache(songId);

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
		}

		console.log(`Song ID: ${songId}`);
		console.log(`Song Name: ${song.name}`);
		console.log(`Artist: ${song.artist}`);

		// If client_mode query parameter is present, return song info instead of redirecting
		if (clientMode) {
			return jsonResp(200, {
				songId: songId,
				redirectUrl: `${REDIRECT_URL}/song/cached/${songId}`,
				song: {
					name: song.name,
					artist: song.artist
				}
			});
		}

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
