import { Link, useLoaderData, useNavigate } from 'react-router-dom';
import { Box, Button, Card, Divider, Group, Select, SimpleGrid, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useMemo, useState } from 'react';
import type { LiteSongDto, MyPlaylistDto } from '../../types';
import { useCreatePlaylist } from '../../features/playlist/hooks/playlists';
import { IconPin, IconPlaylistAdd } from '@tabler/icons-react';

type SortKey = 'alpha' | 'new' | 'old';

const SORT_STORAGE_KEY = 'russchords-my-playlists-sort';

/**
 * Backward-compatible "created order" for a playlist. Prefers the real
 * backend `createdAt` timestamp; falls back to `playlistId` for responses
 * cached before the backend started sending it (playlistId is auto-
 * incremented so it gives the same ordering, just not as precise).
 */
function createdOrder(p: MyPlaylistDto): number {
	if (p.createdAt) return Date.parse(p.createdAt);
	return p.playlistId ?? 0;
}

export function MyPlaylistsPage() {
	const loaded = useLoaderData() as MyPlaylistDto[];
	const navigate = useNavigate();

	const [sort, setSort] = useState<SortKey>(() => {
		const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(SORT_STORAGE_KEY) : null;
		if (saved === 'alpha' || saved === 'new' || saved === 'old') return saved;
		// New default: newest first. Users who want alphabetical can still pick
		// it from the dropdown and their choice gets persisted below.
		return 'new';
	});

	const playlists = useMemo(() => {
		const arr = [...(loaded ?? [])];
		arr.sort((a, b) => {
			if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
			if (sort === 'alpha') return (a.title ?? '').localeCompare(b.title ?? '');
			if (sort === 'new') return createdOrder(b) - createdOrder(a);
			return createdOrder(a) - createdOrder(b);
		});
		return arr;
	}, [loaded, sort]);

	const handleSortChange = (v: string | null) => {
		const next: SortKey = v === 'alpha' || v === 'new' || v === 'old' ? v : 'new';
		setSort(next);
		localStorage.setItem(SORT_STORAGE_KEY, next);
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
											<Box key={s.id}>
												<Text size="sm" c="dimmed" truncate>
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
