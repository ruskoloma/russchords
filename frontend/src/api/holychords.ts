import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import type { CachedSongDto } from '../types';
import { api } from './client';
import { keys } from './keys';

export const SEARCH_PAGE_SIZE = 10;
/** Google Custom Search returns at most 100 results. */
export const SEARCH_MAX_PAGES = 10;

export interface SearchItem {
	title: string;
	link: string;
	snippet: string;
}

export interface SearchResponse {
	items?: SearchItem[];
	searchInformation?: { totalResults?: string };
}

const env = import.meta.env;

async function searchHolychords(q: string, start: number, signal?: AbortSignal): Promise<SearchResponse> {
	if (!env.VITE_GOOGLE_SEARCH_KEY || !env.VITE_GOOGLE_SEARCH_CX) {
		throw new Error('Search is not configured');
	}
	const url = new URL('https://www.googleapis.com/customsearch/v1');
	url.searchParams.set('key', env.VITE_GOOGLE_SEARCH_KEY);
	url.searchParams.set('cx', env.VITE_GOOGLE_SEARCH_CX);
	url.searchParams.set('q', `${q} -filetype:pdf`);
	if (start > 1) url.searchParams.set('start', String(start));

	let res: Response;
	try {
		res = await fetch(url, { signal });
	} catch (err) {
		if (err instanceof DOMException && err.name === 'AbortError') throw err;
		throw new Error(navigator.onLine ? 'Could not reach the search service' : 'You are offline');
	}
	if (!res.ok) {
		if (res.status === 429 || res.status === 403) {
			throw new Error('The daily search limit was reached. Please try again later.');
		}
		throw new Error(`Search failed (HTTP ${res.status})`);
	}
	return res.json();
}

export function useHolychordsSearch(q: string, page: number) {
	const start = (page - 1) * SEARCH_PAGE_SIZE + 1;
	return useQuery({
		queryKey: keys.search(q, start),
		queryFn: ({ signal }) => searchHolychords(q, start, signal),
		enabled: q.trim().length > 0,
		staleTime: 1000 * 60 * 30,
		refetchOnWindowFocus: false,
		placeholderData: keepPreviousData,
		retry: false,
		meta: { persist: false },
	});
}

/** Extracts the holychords song id from a song URL, e.g. https://holychords.pro/12345 */
export function holychordsIdFromUrl(link: string): string | null {
	try {
		const url = new URL(link.trim());
		if (!/(^|\.)holychords\.(pro|com|net|ru)$/i.test(url.hostname)) return null;
		return url.pathname.split('/').filter(Boolean).at(-1) ?? null;
	} catch {
		return null;
	}
}

/**
 * Asks the parser Lambda to import a holychords song and returns the id of
 * the cached copy we can open in-app.
 */
export async function importHolychordsSong(holychordsId: string): Promise<string> {
	const domain = env.VITE_LAMBDA_PARSER_DOMAIN;
	if (!domain) throw new Error('Song import is not configured');
	const base = /^https?:\/\//.test(domain) ? domain : `https://${domain}`;

	let res: Response;
	try {
		res = await fetch(`${base.replace(/\/$/, '')}/${encodeURIComponent(holychordsId)}?client_mode=true`);
	} catch {
		throw new Error(navigator.onLine ? 'Could not reach the song importer' : 'You are offline');
	}
	const data = (await res.json().catch(() => ({}))) as { songId?: string | number; error?: string };
	if (!res.ok || data.songId == null) throw new Error(data.error || 'Could not open this song');
	return String(data.songId);
}

export const cachedSongQuery = (id: string) =>
	queryOptions({
		queryKey: keys.cachedSong(id),
		queryFn: async ({ signal }) => (await api.get<CachedSongDto>(`/cachedsong/${id}`, { signal })).data,
		staleTime: 1000 * 60 * 60,
	});

export function useCachedSong(id: string) {
	return useQuery({ ...cachedSongQuery(id), enabled: Boolean(id) });
}
