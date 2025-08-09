import { useLoaderData, useNavigate } from 'react-router-dom';
import { Card, Group, Stack, Text, SimpleGrid, Select } from '@mantine/core';
import { useMemo, useState } from 'react';
import type { SongDto, PlaylistSummary } from '../../types';

export default function MyPlaylistsPage() {
	const loaded = useLoaderData() as PlaylistSummary[];
	const navigate = useNavigate();

	const [sort, setSort] = useState<'alpha' | 'new' | 'old'>('alpha');

	const playlists = useMemo(() => {
		const arr = [...(loaded ?? [])];
		if (sort === 'alpha') {
			arr.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
		} else if (sort === 'new') {
			arr.sort((a, b) => (b.id ?? 0) - (a.id ?? 0)); // если нет даты — по id убыв.
		} else {
			arr.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
		}
		return arr;
	}, [loaded, sort]);

	return (
		<Stack gap="md">
			<Group justify="space-between">
				<Text fw={700} size="xl">
					My Playlists
				</Text>
				<Select
					value={sort}
					onChange={(v) => setSort((v as any) ?? 'alpha')}
					data={[
						{ value: 'alpha', label: 'Alphabetical' },
						{ value: 'new', label: 'Newest first' },
						{ value: 'old', label: 'Oldest first' },
					]}
					w={220}
				/>
			</Group>

			<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
				{playlists.map((pl) => {
					const firstFive: SongDto[] = (pl.songs ?? []).slice(0, 5);
					return (
						<Card
							key={pl.id}
							withBorder
							shadow="sm"
							onClick={() => navigate(`/playlist/${pl.id}`)}
							className="cursor-pointer"
						>
							<Stack gap={6}>
								<Text fw={800} size="lg">
									{pl.title}
								</Text>
								{firstFive.length === 0 ? (
									<Text size="sm" c="dimmed">
										No songs yet
									</Text>
								) : (
									<Stack gap={2}>
										{firstFive.map((s) => (
											<Text key={s.id} size="sm" c="dimmed">
												{s.name}
												{s.artist ? ` — ${s.artist}` : ''}
											</Text>
										))}
									</Stack>
								)}
							</Stack>
						</Card>
					);
				})}
			</SimpleGrid>
		</Stack>
	);
}
