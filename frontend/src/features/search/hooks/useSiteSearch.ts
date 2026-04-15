import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { type SearchResponse, searchSite } from './search';
import { PAGE_SIZE } from '../constants/search';

/**
 * Full state machine for the HolyChords search UI:
 *   - `q` — the input value (what the user has typed, may not be submitted)
 *   - `searchTrigger` — the actually-submitted query; only this populates SWR
 *   - `startIndex` — pagination offset (1-based), reflected in `?start=` URL
 *
 * The hook also keeps the URL in sync both ways: typing then submitting
 * writes `?q=&start=` into the URL, and deep-linking to a search URL
 * reconstitutes the state on mount so refresh/back preserve search results.
 */
export function useSiteSearch() {
	const [searchParams, setSearchParams] = useSearchParams();

	const [q, setQ] = useState('');
	const [startIndex, setStartIndex] = useState<number | undefined>(undefined);
	const [searchTrigger, setSearchTrigger] = useState<string | null>(null);

	// Only create the SWR cache key once a search has actually been triggered
	// — stops the query from firing on every keystroke.
	const cacheKey = searchTrigger ? `search-${searchTrigger}-${startIndex || 1}` : null;

	const { data, error, isLoading } = useSWR<SearchResponse>(
		cacheKey,
		() => searchSite(searchTrigger!, startIndex),
		{
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
			dedupingInterval: 60_000,
		},
	);

	const totalResults = useMemo(() => Number(data?.searchInformation?.totalResults || 0), [data]);

	const totalPages = useMemo(() => {
		if (!totalResults) return 0;
		// Cap to 10 pages — the Google Custom Search API itself caps results
		// around this number, and an unbounded pagination control reads noisy.
		return Math.min(Math.ceil(totalResults / PAGE_SIZE), 10);
	}, [totalResults]);

	const currentPage = useMemo(() => {
		if (!startIndex) return 1;
		return Math.floor(((startIndex || 1) - 1) / PAGE_SIZE) + 1;
	}, [startIndex]);

	// Re-hydrate state from URL on first render (and when the URL params
	// change, e.g. via browser back).
	const urlQuery = searchParams.get('q');
	useEffect(() => {
		const urlStart = searchParams.get('start');
		let hasUrlParams = false;

		if (urlQuery) {
			setQ(urlQuery);
			hasUrlParams = true;
		}
		if (urlStart) {
			const startNum = parseInt(urlStart, 10);
			if (!isNaN(startNum)) {
				setStartIndex(startNum);
				hasUrlParams = true;
			}
		}
		if (hasUrlParams && urlQuery) {
			setSearchTrigger(urlQuery);
		}
	}, [searchParams, urlQuery]);

	const submit = useCallback(() => {
		if (!q.trim()) return;
		const newParams = new URLSearchParams(searchParams);
		newParams.set('q', q.trim());
		newParams.delete('start');
		setStartIndex(undefined);
		setSearchParams(newParams);
		setSearchTrigger(q.trim());
	}, [q, searchParams, setSearchParams]);

	const goToPage = useCallback(
		(page: number) => {
			const newStart = (page - 1) * PAGE_SIZE + 1;
			setStartIndex(newStart);

			const newParams = new URLSearchParams(searchParams);
			if (newStart > 1) {
				newParams.set('start', newStart.toString());
			} else {
				newParams.delete('start');
			}
			setSearchParams(newParams);

			// Re-fire the same search on the new page.
			if (searchTrigger) setSearchTrigger(searchTrigger);
		},
		[searchParams, setSearchParams, searchTrigger],
	);

	return {
		q,
		setQ,
		submit,
		goToPage,
		data,
		error,
		isLoading,
		totalResults,
		totalPages,
		currentPage,
		urlQuery,
	};
}
