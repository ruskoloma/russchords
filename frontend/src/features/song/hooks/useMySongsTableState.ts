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

	const [sortStatus, setSortStatus] = useState<DataTableSortStatus<LiteSongDto>>({
		columnAccessor: 'name',
		direction: 'asc',
	});

	const [selected, setSelected] = useState<LiteSongDto[]>([]);

	const filtered = useMemo(() => {
		if (!debouncedQuery.trim()) return data;
		const q = debouncedQuery.trim().toLowerCase();
		return data.filter((r) => r.name?.toLowerCase().includes(q));
	}, [data, debouncedQuery]);

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
	}, [debouncedQuery, sortStatus]);

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
