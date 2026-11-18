/** Case-, accent- and ё/е-insensitive form of a string for client-side search. */
export const normalizeSearch = (s: string) => s.toLowerCase().replace(/ё/g, 'е').normalize('NFD').replace(/[̀-ͯ]/g, '');

/** True when every word of `query` occurs in `haystack` (both normalized). */
export const matchesAllWords = (haystack: string, query: string) => {
	const q = normalizeSearch(query.trim());
	if (!q) return true;
	const h = normalizeSearch(haystack);
	return q.split(/\s+/).every((part) => h.includes(part));
};
