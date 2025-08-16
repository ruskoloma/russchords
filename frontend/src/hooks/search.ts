import { apiKey, cx } from '../constants/search.ts';

export interface SearchItem {
	title: string;
	link: string;
	snippet: string;
}

export interface SearchResponse {
	items?: SearchItem[];
	searchInformation?: {
		totalResults?: string;
	};
	queries?: {
		nextPage?: Array<{ startIndex: number }>;
		previousPage?: Array<{ startIndex: number }>;
	};
}

if (!cx) {
	throw new Error('Google Search CX (VITE_GOOGLE_SEARCH_CX) is not configured');
}

export async function searchSite(q: string, start?: number): Promise<SearchResponse> {
	if (!apiKey) {
		throw new Error('Google Search API key not configured in VITE_GOOGLE_SEARCH_KEY');
	}
	if (!cx) {
		throw new Error('Google Search CX (VITE_GOOGLE_SEARCH_CX) is not configured');
	}
	const url = new URL('https://www.googleapis.com/customsearch/v1');
	url.searchParams.set('key', apiKey);
	url.searchParams.set('cx', cx);
	url.searchParams.set('q', q);
	if (start) url.searchParams.set('start', String(start));

	try {
		const res = await fetch(url.toString(), { method: 'GET' });
		if (!res.ok) {
			let detail = '';
			try {
				const errJson = await res.json();
				detail = errJson?.error?.message || JSON.stringify(errJson);
			} catch {
				detail = await res.text();
			}
			const hint = res.status === 403 ? ' (check API key restrictions or quota)' : '';
			throw new Error(`Google Search failed: HTTP ${res.status}${hint}${detail ? ` – ${detail}` : ''}`);
		}
		return res.json();
	} catch (e: unknown) {
		if (e instanceof Error) throw e;
		throw new Error('Network error while calling Google Custom Search');
	}
}
