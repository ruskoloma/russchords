import { Link, useLoaderData, useNavigate } from 'react-router-dom';
import { Box, Button, Card, Divider, Group, Select, SimpleGrid, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useMemo, useState } from 'react';
import type { LiteSongDto, MyPlaylistDto } from '../../types';
import { useCreatePlaylist } from '../../hooks/playlists';
import { IconPin, IconPlaylistAdd } from '@tabler/icons-react';

type SortKey = 'alpha' | 'new' | 'old';

export default function MyPlaylistsPage() {
	const loaded = useLoaderData() as MyPlaylistDto[];
	const navigate = useNavigate();

	const [sort, setSort] = useState<SortKey>('alpha');

	const playlists = useMemo(() => {
		const arr = [...(loaded ?? [])];
		arr.sort((a, b) => {
			if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
			if (sort === 'alpha') return (a.title ?? '').localeCompare(b.title ?? '');
			if (sort === 'new') return (b.playlistId ?? 0) - (a.playlistId ?? 0);
			return (a.playlistId ?? 0) - (b.playlistId ?? 0);
		});
		return arr;
	}, [loaded, sort]);

	const handleSortChange = (v: string | null) => {
		if (v === 'alpha' || v === 'new' || v === 'old') setSort(v);
		else setSort('alpha');
	};

	const { createPlaylist, isCreating } = useCreatePlaylist({
		onSuccess: (created) => {
			modals.closeAll();
			navigate(`/playlist/${created.id}`);
		},
	});

	const openCreateModal = () => {
		let title = '';
		let description = '';

		const onSubmit = async () => {
			if (!title.trim()) return;
			await createPlaylist({ title: title.trim(), description: description.trim() || null });
		};

		modals.open({
			title: 'Create playlist',
			centered: false,
			styles: {
				content: {
					marginTop: '10vh',
				},
			},
			children: (
				<Stack gap="sm">
					<TextInput
						label="Title"
						placeholder="My new playlist"
						onChange={(e) => (title = e.currentTarget.value)}
						autoFocus
					/>
					<Textarea
						label="Description"
						placeholder="Optional description"
						autosize
						minRows={3}
						onChange={(e) => (description = e.currentTarget.value)}
					/>
					<Group justify="flex-end" mt="sm">
						<Button variant="light" onClick={() => modals.closeAll()} disabled={isCreating}>
							Cancel
						</Button>
						<Button onClick={onSubmit} loading={isCreating}>
							Create
						</Button>
					</Group>
				</Stack>
			),
		});
	};

	return (
		<Stack gap="md">
			<Group justify="space-between" wrap="wrap">
				<Text fw={700} size="xl">
					My Playlists
				</Text>
				<Group>
					<Select
						value={sort}
						onChange={handleSortChange}
						data={[
							{ value: 'alpha', label: 'Alphabetical' },
							{ value: 'new', label: 'Newest first' },
							{ value: 'old', label: 'Oldest first' },
						]}
						w={220}
					/>
					<Button onClick={openCreateModal}>
						Add <IconPlaylistAdd size={20} />
					</Button>
				</Group>
			</Group>

			<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
				{playlists.map((pl) => {
					const firstFive: LiteSongDto[] = (pl.songs ?? []).slice(0, 5);
					return (
						<Card
							key={pl.playlistId}
							withBorder
							shadow="sm"
							component={Link}
							to={`/playlist/${pl.playlistId}`}
							style={{ cursor: 'pointer', position: 'relative' }}
						>
							<Stack gap={8} h="100%">
								<Group justify="space-between" align="start">
									<Text fw={800} size="lg" truncate>
										{pl.title}
									</Text>
									{pl.isPinned && (
										<Box style={{ position: 'absolute', top: 8, right: 8 }}>
											<IconPin size={20} color={'red'} />
										</Box>
									)}
								</Group>

								<Box flex={'1'} />

								{firstFive.length === 0 ? (
									<Text size="sm" c="dimmed">
										No songs yet
									</Text>
								) : (
									<Stack gap={2}>
										{firstFive.map((s) => (
											<Box>
												<Text key={s.id} size="sm" c="dimmed" truncate>
													{s.name}
												</Text>
												<Divider />
											</Box>
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
