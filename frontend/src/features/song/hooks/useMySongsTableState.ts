import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '@mantine/hooks';
import type { DataTableSortStatus } from 'mantine-datatable';
import type { LiteSongDto } from '../../../types';

const PAGE_SIZE_STORAGE_KEY = 'russchords-my-songs-size';

/**
 * Owns every piece of state the My Songs table needs: filter query,
 * sort order, pagination (persisted in URL + localStorage), and bulk
 * selection. The page component receives a single object with the
 * view-ready records plus setters for the table to call.
 */
export function useMySongsTableState(initial: LiteSongDto[]) {
	const [searchParams, setSearchParams] = useSearchParams();

	const [data, setData] = useState<LiteSongDto[]>(initial);
	// Keep the local copy in sync when the loader reruns.
	useEffect(() => setData(initial), [initial]);

	const [query, setQuery] = useState('');
	const [debouncedQuery] = useDebouncedValue(query, 250);

	const [sortStatus, setSortStatus] = useState<DataTableSortStatus<LiteSongDto>>({
		columnAccessor: 'name',
		direction: 'asc',
	});

	const page = parseInt(searchParams.get('page') || '1', 10);
	const setPage = (p: number) => {
		setSearchParams((prev) => {
			prev.set('page', String(p));
			return prev;
		});
	};

	const [pageSize, setPageSize] = useState(() => {
		const saved = localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
		if (saved) return parseInt(saved, 10);
		return 15;
	});

	const handlePageSizeChange = (v: number) => {
		setPageSize(v);
		localStorage.setItem(PAGE_SIZE_STORAGE_KEY, v.toString());
	};

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

	const total = sorted.length;
	const paginated = useMemo(() => {
		const from = (page - 1) * pageSize;
		return sorted.slice(from, from + pageSize);
	}, [sorted, page, pageSize]);

	// Reset to page 1 whenever the query or page size changes, so the user
	// never ends up stuck on "page 7 of 3" after shrinking the filtered set.
	const prevDeps = useRef({ query: debouncedQuery, pageSize });
	useEffect(() => {
		const prev = prevDeps.current;
		if (prev.query !== debouncedQuery || prev.pageSize !== pageSize) {
			if (page !== 1) setPage(1);
			prevDeps.current = { query: debouncedQuery, pageSize };
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedQuery, pageSize]);

	const removeFromData = (ids: number[]) => {
		setData((prev) => prev.filter((r) => !ids.includes(r.id)));
		setSelected([]);
	};

	const clearSelection = () => setSelected([]);

	return {
		// view-ready records
		paginated,
		total,
		// filter
		query,
		setQuery,
		debouncedQuery,
		// sort
		sortStatus,
		setSortStatus,
		// pagination
		page,
		setPage,
		pageSize,
		handlePageSizeChange,
		// selection
		selected,
		setSelected,
		clearSelection,
		// mutation helpers
		removeFromData,
	};
}
