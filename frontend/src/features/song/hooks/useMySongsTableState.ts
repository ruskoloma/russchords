import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import type { DataTableSortStatus } from 'mantine-datatable';
import type { LiteSongDto } from '../../../types';

const INITIAL_VISIBLE = 40;
const CHUNK_SIZE = 40;

/**
 * State for the My Songs list. Owns the filter query, sort order, bulk
 * selection, and the progressive "visible window" used by infinite scroll
 * — `visible` rows are revealed at a time, and `loadMore()` bumps the
 * window when the user scrolls to the sentinel at the bottom of the list.
 *
 * Resetting behavior: any time the filter query or sort order changes the
 * visible window snaps back to `INITIAL_VISIBLE` so the user isn't greeted
 * by a half-materialized list scrolled past the matching results.
 */
export function useMySongsTableState(initial: LiteSongDto[]) {
	const [data, setData] = useState<LiteSongDto[]>(initial);
	// Keep the local copy in sync when the loader reruns.
	useEffect(() => setData(initial), [initial]);

	const [query, setQuery] = useState('');
	const [debouncedQuery] = useDebouncedValue(query, 250);

	const [selectedTags, setSelectedTags] = useState<string[]>([]);

	const [sortStatus, setSortStatus] = useState<DataTableSortStatus<LiteSongDto>>({
		columnAccessor: 'name',
		direction: 'asc',
	});

	const [selected, setSelected] = useState<LiteSongDto[]>([]);

	// Union of every tag present across the loaded songs. Case-preserved
	// from the first occurrence; deduped case-insensitively so "Worship"
	// and "worship" collapse into a single filter option.
	const availableTags = useMemo(() => {
		const seen = new Map<string, string>();
		for (const song of data) {
			for (const t of song.tags ?? []) {
				const key = t.toLowerCase();
				if (!seen.has(key)) seen.set(key, t);
			}
		}
		return [...seen.values()].sort((a, b) => a.localeCompare(b));
	}, [data]);

	const filtered = useMemo(() => {
		let result = data;
		if (selectedTags.length > 0) {
			const selectedLower = selectedTags.map((t) => t.toLowerCase());
			result = result.filter((r) => {
				const rowTags = (r.tags ?? []).map((t) => t.toLowerCase());
				// A song matches if it has EVERY selected tag (AND semantics).
				return selectedLower.every((sel) => rowTags.includes(sel));
			});
		}
		if (debouncedQuery.trim()) {
			const q = debouncedQuery.trim().toLowerCase();
			result = result.filter((r) => r.name?.toLowerCase().includes(q));
		}
		return result;
	}, [data, debouncedQuery, selectedTags]);

	const sorted = useMemo(() => {
		const { columnAccessor, direction } = sortStatus;
		const key = columnAccessor as keyof LiteSongDto;
		return [...filtered].sort((a, b) => {
			const av = a[key] ?? '';
			const bv = b[key] ?? '';
			return direction === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
		});
	}, [filtered, sortStatus]);

	const [visible, setVisible] = useState(INITIAL_VISIBLE);

	// Snap the window back to the initial chunk whenever the filtered/sorted
	// list identity changes. Without this, users who scroll to row 400 and
	// then type a filter would still see "400 visible" of a 5-row match.
	useEffect(() => {
		setVisible(INITIAL_VISIBLE);
	}, [debouncedQuery, sortStatus, selectedTags]);

	const loadMore = useCallback(() => {
		setVisible((v) => Math.min(v + CHUNK_SIZE, sorted.length));
	}, [sorted.length]);

	const visibleRecords = useMemo(() => sorted.slice(0, visible), [sorted, visible]);
	const hasMore = visible < sorted.length;
	const total = sorted.length;

	const removeFromData = (ids: number[]) => {
		setData((prev) => prev.filter((r) => !ids.includes(r.id)));
		setSelected([]);
	};

	const clearSelection = () => setSelected([]);

	return {
		// view-ready records
		visibleRecords,
		total,
		hasMore,
		loadMore,
		// filter
		query,
		setQuery,
		debouncedQuery,
		selectedTags,
		setSelectedTags,
		availableTags,
		// sort
		sortStatus,
		setSortStatus,
		// selection
		selected,
		setSelected,
		clearSelection,
		// mutation helpers
		removeFromData,
	};
}
