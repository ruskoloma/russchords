import { useLoaderData, useNavigate, useLocation } from 'react-router-dom';
import { DataTable } from 'mantine-datatable';
import { Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { LiteSongDto } from '../../types';
import { createNavigationUrl } from '../../lib/navigation';
import { useMySongsTableState } from '../../features/song/hooks/useMySongsTableState';
import { useBulkSongActions } from '../../features/song/hooks/useBulkSongActions';
import { MySongsToolbar } from '../../features/song/components/MySongsToolbar';

/**
 * My Songs table page. State management (filter, sort, pagination,
 * selection) and the bulk-action confirmation flows live in feature hooks;
 * this page is the declarative composition.
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
				records={table.paginated}
				totalRecords={table.total}
				withTableBorder
				withColumnBorders
				highlightOnHover
				sortStatus={table.sortStatus}
				onSortStatusChange={table.setSortStatus}
				page={table.page}
				onPageChange={table.setPage}
				recordsPerPage={table.pageSize}
				onRecordsPerPageChange={table.handlePageSizeChange}
				recordsPerPageOptions={isMobile ? [15] : [15, 25, 50, 100]}
				paginationText={({ from, to, totalRecords }) => `${from}–${to} of ${totalRecords}`}
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
				minHeight={'600px'}
			/>
		</Stack>
	);
};
