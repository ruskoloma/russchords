import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { HttpError } from './classes.js';
import * as cheerio from 'cheerio';
import { REGION } from './constants.js';

const ssm = new SSMClient({ region: REGION });

export async function getParam(name, decrypt = false) {
	const command = new GetParameterCommand({
		Name: name,
		WithDecryption: decrypt,
	});

	const response = await ssm.send(command);
	return response.Parameter.Value;
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
	return $('#music_text').text().trim() || null;
}
