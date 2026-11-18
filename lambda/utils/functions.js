import { HttpError } from './classes.js';
import * as cheerio from 'cheerio';

function cleanSongText(text) {
	return text
		.replace(/(?:\*\*)?мы\s+запрещаем\s+что\s+либо\s+копировать\s+с\s+нашего\s+сайта(?:\*\*)?/gi, '')
		.trim();
}

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

	const name = cleanSongText($('h2').text()) || 'Untitled';
	const artist = cleanSongText($('h2 + h5').text()) || 'Unknown';
	const content = cleanSongText($('#music_text').text());

	if (!content) return null;

	return { name, artist, content };
}
