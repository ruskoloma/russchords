/**
 * Builds a link that remembers where it was opened from (`?source=`), so the
 * back arrow on the target page returns to the right list even after a
 * reload or when history is empty.
 */
export function withSource(targetPath: string, current: { pathname: string; search: string }): string {
	const source = `${current.pathname}${current.search}`;
	const sep = targetPath.includes('?') ? '&' : '?';
	return `${targetPath}${sep}source=${encodeURIComponent(source)}`;
}
