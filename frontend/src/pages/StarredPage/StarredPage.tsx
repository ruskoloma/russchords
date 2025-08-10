import { useMemo, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import { ActionIcon, Group, Stack } from '@mantine/core';
import { IconStar, IconStarFilled } from '@tabler/icons-react';
import type { SongDto } from '../../types';
import { useStarSongs, useUnstarSong } from '../../hooks/starred';

export const StarredPage: React.FC = () => {
	const loaded = useLoaderData() as SongDto[];
	const navigate = useNavigate();

	const [sortStatus, setSortStatus] = useState<DataTableSortStatus<SongDto>>({
		columnAccessor: 'name',
		direction: 'asc',
	});

	const [overrides, setOverrides] = useState<Record<number, boolean>>({});
	const [pending, setPending] = useState<Set<number>>(new Set());

	const { starSongs } = useStarSongs();
	const { unstarSong } = useUnstarSong();

	const data = useMemo(() => loaded, [loaded]);

	const sorted = useMemo(() => {
		const { columnAccessor, direction } = sortStatus;
		const key = columnAccessor as keyof SongDto;
		return [...data].sort((a, b) => {
			const av = a[key] ?? '';
			const bv = b[key] ?? '';
			return direction === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
		});
	}, [data, sortStatus]);

	const toggleStar = async (song: SongDto) => {
		if (pending.has(song.id)) return;
		setPending((s) => new Set(s).add(song.id));
		const isStarred = overrides[song.id] ?? true;
		try {
			if (isStarred) {
				await unstarSong(song.id);
				setOverrides((m) => ({ ...m, [song.id]: false }));
			} else {
				await starSongs([song.id]);
				setOverrides((m) => ({ ...m, [song.id]: true }));
			}
		} finally {
			setPending((s) => {
				const n = new Set(s);
				n.delete(song.id);
				return n;
			});
		}
	};

	return (
		<Stack gap="md">
			<DataTable<SongDto>
				idAccessor="id"
				records={sorted}
				withTableBorder
				withColumnBorders
				highlightOnHover
				sortStatus={sortStatus}
				onSortStatusChange={setSortStatus}
				columns={[
					{ accessor: 'name', title: 'Name', sortable: true, render: (r) => r.name ?? '—' },
					{ accessor: 'artist', title: 'Artist', sortable: true, render: (r) => r.artist ?? '—' },
					{
						accessor: 'star',
						title: '',
						width: 80,
						textAlign: 'center',
						render: (r) => {
							const isStarred = overrides[r.id] ?? true;
							const isPending = pending.has(r.id);
							return (
								<Group justify="center" gap="xs">
									<ActionIcon
										variant={'subtle'}
										color="yellow"
										onClick={(event) => {
											event.stopPropagation();
											return toggleStar(r);
										}}
										disabled={isPending}
										aria-label={isStarred ? 'Unstar' : 'Star'}
									>
										{isStarred ? <IconStarFilled size={18} /> : <IconStar size={18} />}
									</ActionIcon>
								</Group>
							);
						},
					},
				]}
				onRowClick={(row) => navigate(`/song/${row.record.id}`)}
				noRecordsText="No starred songs"
				minHeight={'500px'}
			/>
		</Stack>
	);
};
