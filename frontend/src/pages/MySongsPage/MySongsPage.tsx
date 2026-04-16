import { useEffect, useRef } from 'react';
import { useLoaderData, useNavigate, useLocation } from 'react-router-dom';
import { DataTable } from 'mantine-datatable';
import { Box, Loader, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { LiteSongDto } from '../../types';
import { createNavigationUrl } from '../../lib/navigation';
import { useMySongsTableState } from '../../features/song/hooks/useMySongsTableState';
import { useBulkSongActions } from '../../features/song/hooks/useBulkSongActions';
import { MySongsToolbar } from '../../features/song/components/MySongsToolbar';

/**
 * My Songs page. Uses a DataTable without pagination — instead an
 * IntersectionObserver sentinel at the bottom bumps the visible window
 * via `table.loadMore()` whenever the user scrolls near the end.
 */
export const MySongsPage: React.FC = () => {
	const loaded = useLoaderData() as LiteSongDto[];
	const navigate = useNavigate();
	const location = useLocation();
	const isMobile = useMediaQuery('(max-width: 48em)');

	const table = useMySongsTableState(loaded ?? []);
	const actions = useBulkSongActions({
		onAfterDelete: (deletedIds) => table.removeFromData(deletedIds),
	});

	// Sentinel element at the bottom of the list. When it enters the viewport
	// we call `loadMore()` which extends the visible window by a chunk.
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		const el = sentinelRef.current;
		if (!el) return;
		if (!table.hasMore) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					table.loadMore();
				}
			},
			{ rootMargin: '200px' },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [table.hasMore, table.loadMore, table.visibleRecords.length]);

	return (
		<Stack gap="md">
			<MySongsToolbar
				query={table.query}
				onQueryChange={table.setQuery}
				onNewSong={() => navigate('/song/create')}
				selectedCount={table.selected.length}
				isDeleting={actions.isDeleting}
				isMobile={!!isMobile}
				onDeleteSelected={() => actions.confirmDelete(table.selected)}
			/>

			<DataTable<LiteSongDto>
				striped
				idAccessor="id"
				records={table.visibleRecords}
				withTableBorder
				withColumnBorders
				highlightOnHover
				sortStatus={table.sortStatus}
				onSortStatusChange={table.setSortStatus}
				selectedRecords={isMobile ? undefined : table.selected}
				onSelectedRecordsChange={isMobile ? undefined : table.setSelected}
				columns={[
					{
						accessor: 'name',
						title: 'Name',
						sortable: true,
						render: (r) => (
							<Text truncate maw={{ base: 180, xs: 240, sm: 320, md: 420, lg: 520 }}>
								{r.name ?? '—'}
							</Text>
						),
					},
					{
						accessor: 'artist',
						title: 'Artist',
						sortable: true,
						render: (r) => (
							<Text truncate maw={{ base: 120, xs: 160, sm: 220, md: 280, lg: 360 }}>
								{r.artist ?? '—'}
							</Text>
						),
					},
				]}
				noRecordsText={table.debouncedQuery ? 'No matches' : 'No songs'}
				onRowClick={(row) => navigate(createNavigationUrl(`/song/${row.record.id}`, location))}
				minHeight={table.total === 0 ? '200px' : undefined}
			/>

			{/* Sentinel + feedback footer */}
			<Box ref={sentinelRef} py="sm" ta="center">
				{table.hasMore ? (
					<Loader size="sm" />
				) : table.total > 0 ? (
					<Text size="xs" c="dimmed">
						{table.total} song{table.total === 1 ? '' : 's'}
					</Text>
				) : null}
			</Box>
		</Stack>
	);
};
