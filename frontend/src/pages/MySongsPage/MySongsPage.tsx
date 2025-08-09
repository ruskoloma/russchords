import { useEffect, useMemo, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import { TextInput, Button, Group, Stack } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import type { SongDto } from '../../types';
import { useDeleteSongs, useAddSongsToPlaylist } from '../../hooks/song';

export const MySongsPage: React.FC = () => {
	const loaded = useLoaderData() as SongDto[];
	const navigate = useNavigate();

	const [data, setData] = useState<SongDto[]>(loaded ?? []);
	useEffect(() => setData(loaded ?? []), [loaded]);

	const [query, setQuery] = useState('');
	const [debouncedQuery] = useDebouncedValue(query, 250);

	const [sortStatus, setSortStatus] = useState<DataTableSortStatus<SongDto>>({
		columnAccessor: 'name',
		direction: 'asc',
	});

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const [selected, setSelected] = useState<SongDto[]>([]);

	const filtered = useMemo(() => {
		if (!debouncedQuery.trim()) return data;
		const q = debouncedQuery.trim().toLowerCase();
		return data.filter((r) => r.name?.toLowerCase().includes(q));
	}, [data, debouncedQuery]);

	const sorted = useMemo(() => {
		const { columnAccessor, direction } = sortStatus;
		const key = columnAccessor as keyof SongDto;
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

	useEffect(() => setPage(1), [debouncedQuery, pageSize]);

	const { deleteSongs, isDeleting } = useDeleteSongs();
	const { addToPlaylist, isAdding } = useAddSongsToPlaylist();

	const onDeleteSelected = () => {
		modals.openConfirmModal({
			title: 'Confirm deletion',
			children: <p>Are you sure you want to delete {selected.length} song(s)?</p>,
			labels: { confirm: 'Delete', cancel: 'Cancel' },
			confirmProps: { color: 'red' },
			onConfirm: async () => {
				const ids = selected.map((r) => r.id);
				const deletedIds = await deleteSongs(ids);
				setData((prev) => prev.filter((r) => !deletedIds.includes(r.id)));
				setSelected([]);
			},
		});
	};

	const onAddToPlaylist = async () => {
		if (selected.length === 0) return;
		const playlistId = prompt('Enter playlist ID');
		if (!playlistId) return;
		const ids = selected.map((r) => r.id);
		await addToPlaylist(playlistId, ids);
		setSelected([]);
	};

	return (
		<Stack gap="md">
			<Group justify="space-between" wrap="wrap">
				<TextInput
					placeholder="Filter by name…"
					value={query}
					onChange={(e) => setQuery(e.currentTarget.value)}
					w={320}
				/>
				<Group>
					<Button
						variant="default"
						disabled={selected.length === 0 || isAdding}
						onClick={onAddToPlaylist}
						loading={isAdding}
					>
						Add to playlist
					</Button>
					<Button
						variant="light"
						color="red"
						disabled={selected.length === 0 || isDeleting}
						onClick={onDeleteSelected}
						loading={isDeleting}
					>
						Delete selected ({selected.length})
					</Button>
				</Group>
			</Group>

			<DataTable<SongDto>
				striped
				idAccessor="id"
				records={paginated}
				totalRecords={total}
				withTableBorder
				withColumnBorders
				highlightOnHover
				sortStatus={sortStatus}
				onSortStatusChange={setSortStatus}
				page={page}
				onPageChange={setPage}
				recordsPerPage={pageSize}
				onRecordsPerPageChange={setPageSize}
				recordsPerPageOptions={[10, 20, 50, 100]}
				paginationText={({ from, to, totalRecords }) => `${from}–${to} of ${totalRecords}`}
				selectedRecords={selected}
				onSelectedRecordsChange={setSelected}
				columns={[
					{ accessor: 'name', title: 'Name', sortable: true, render: (r) => r.name ?? '—' },
					{ accessor: 'artist', title: 'Artist', sortable: true, render: (r) => r.artist ?? '—' },
				]}
				noRecordsText={debouncedQuery ? 'No matches' : 'No songs'}
				onRowClick={(row) => navigate(`/song/${row.record.id}`)}
			/>
		</Stack>
	);
};
