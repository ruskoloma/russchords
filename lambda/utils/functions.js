import { HttpError } from './classes.js';
import * as cheerio from 'cheerio';

export function jsonResp(statusCode, obj) {
	return {
		statusCode,
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(obj),
	};
}

export async function getSongFromPage(url) {
	console.log("I'm here: getSongFromPage");
	let res;
	try {
		res = await fetch(url, { timeout: 10_000 });
	} catch (e) {
		throw new HttpError(502, `Upstream fetch failed: ${e.message}`);
	}

	if (!res.ok) throw new HttpError(res.status, res.statusText);

	const html = await res.text();
	const $ = cheerio.load(html);

	const name = $('h2').text().trim() || 'Untitled';
	const artist = $('h2 + h5').text().trim() || 'Unknown';
	const content = $('#music_text').text().trim();

	if (!content) return null;

	return { name, artist, content };
}
