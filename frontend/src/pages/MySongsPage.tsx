import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Affix, Button, Group, Modal, ScrollArea, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconChecks, IconMusic, IconPlaylistAdd, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { useDeleteSongs, useMySongs } from '../api/songs';
import { useAddSongsToPlaylist, useMyPlaylists } from '../api/playlists';
import { useSession } from '../auth/useSession';
import { PageHeader } from '../components/PageHeader';
import { ListSkeleton } from '../components/ListSkeleton';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { SignInRequired } from '../components/SignInRequired';
import { confirmAction } from '../components/confirm';
import { SongList } from '../features/song/components/SongList';
import { usePageTitle } from '../hooks/usePageTitle';
import { notifySuccess } from '../lib/notify';
import { DESKTOP_QUERY } from '../components/layout/AppLayout';

function AddSelectedToPlaylist({ songIds, onDone }: { songIds: number[]; onDone: () => void }) {
	const [opened, { open, close }] = useDisclosure(false);
	const { userId } = useSession();
	const { data: playlists = [] } = useMyPlaylists();
	const add = useAddSongsToPlaylist();
	const owned = playlists.filter((p) => p.ownerId === userId).sort((a, b) => a.title.localeCompare(b.title));

	const onPick = async (playlistId: number, title: string) => {
		await add.mutateAsync({ playlistId, songIds });
		close();
		notifySuccess(`Added ${songIds.length} song${songIds.length === 1 ? '' : 's'} to “${title}”`);
		onDone();
	};

	return (
		<>
			<Button
				variant="default"
				leftSection={<IconPlaylistAdd size={18} />}
				onClick={open}
				disabled={songIds.length === 0}
			>
				Add to playlist
			</Button>
			<Modal opened={opened} onClose={close} title="Add to playlist">
				{owned.length === 0 ? (
					<Text c="dimmed" size="sm">
						You don’t have playlists yet. Create one on the Playlists page.
					</Text>
				) : (
					<ScrollArea.Autosize mah={400}>
						<Stack gap={4}>
							{owned.map((p) => (
								<UnstyledButton
									key={p.playlistId}
									className="list-row"
									data-clickable="true"
									style={{ borderRadius: 'var(--mantine-radius-md)', minHeight: 48 }}
									onClick={() => void onPick(p.playlistId, p.title)}
									disabled={add.isPending}
								>
									<Text fw={600} truncate className="list-row__main">
										{p.title}
									</Text>
									<Text size="sm" c="dimmed">
										{p.songs.length}
									</Text>
								</UnstyledButton>
							))}
						</Stack>
					</ScrollArea.Autosize>
				)}
			</Modal>
		</>
	);
}

export function MySongsPage() {
	usePageTitle('My songs');
	const { isSignedIn } = useSession();
	const { data: songs, isPending, error, refetch } = useMySongs();
	const remove = useDeleteSongs();
	const isDesktop = useMediaQuery(DESKTOP_QUERY, true, { getInitialValueInEffect: false });

	const [selecting, setSelecting] = useState(false);
	const [selected, setSelected] = useState<Set<number>>(new Set());
	const selectedIds = useMemo(() => [...selected], [selected]);

	const toggle = (id: number) =>
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});

	const exitSelection = () => {
		setSelecting(false);
		setSelected(new Set());
	};

	const onDelete = async () => {
		const ok = await confirmAction({
			title: `Delete ${selected.size} song${selected.size === 1 ? '' : 's'}?`,
			message: 'They will also be removed from your playlists. This cannot be undone.',
			confirmLabel: 'Delete',
			danger: true,
		});
		if (!ok) return;
		const { deleted, failedCount } = await remove.mutateAsync(selectedIds);
		notifySuccess(
			failedCount > 0
				? `Deleted ${deleted.length}, ${failedCount} could not be deleted`
				: `Deleted ${deleted.length} song${deleted.length === 1 ? '' : 's'}`,
		);
		exitSelection();
	};

	if (!isSignedIn) return <SignInRequired description="Sign in to keep your own collection of songs." />;

	const newSongButton = (
		<Button component={Link} to="/song/create" leftSection={<IconPlus size={18} />}>
			New song
		</Button>
	);

	return (
		<>
			<PageHeader
				title="My songs"
				actions={
					songs && songs.length > 0 ? (
						selecting ? (
							<Button variant="subtle" color="gray" leftSection={<IconX size={18} />} onClick={exitSelection}>
								Done
							</Button>
						) : (
							<>
								<Button variant="default" leftSection={<IconChecks size={18} />} onClick={() => setSelecting(true)}>
									Select
								</Button>
								{isDesktop && newSongButton}
							</>
						)
					) : undefined
				}
			/>

			{isPending ? (
				<ListSkeleton />
			) : error ? (
				<ErrorState error={error} onRetry={() => void refetch()} />
			) : songs.length === 0 ? (
				<EmptyState
					icon={<IconMusic size={28} />}
					title="No songs yet"
					description="Write a song, import a ChordPro file, or find one on holychords and save it."
					action={
						<Group>
							{newSongButton}
							<Button component={Link} to="/search" variant="default">
								Search songs
							</Button>
						</Group>
					}
				/>
			) : (
				<SongList
					songs={songs}
					stateKey="my-songs"
					selectable={selecting}
					selectedIds={selected}
					onToggleSelected={toggle}
				/>
			)}

			{selecting && (
				<div className="sticky-bottom-bar" style={{ marginInline: 'calc(var(--mantine-spacing-md) * -1)' }}>
					<Group justify="space-between" px="md" py="sm" wrap="wrap" gap="xs">
						<Group gap="xs">
							<Text fw={600}>{selected.size} selected</Text>
							{songs && selected.size < songs.length && (
								<Button variant="subtle" size="compact-sm" onClick={() => setSelected(new Set(songs.map((s) => s.id)))}>
									Select all
								</Button>
							)}
						</Group>
						<Group gap="xs">
							<AddSelectedToPlaylist songIds={selectedIds} onDone={exitSelection} />
							<Button
								color="red"
								variant="light"
								leftSection={<IconTrash size={18} />}
								disabled={selected.size === 0}
								loading={remove.isPending}
								onClick={() => void onDelete()}
							>
								Delete
							</Button>
						</Group>
					</Group>
				</div>
			)}

			{!isDesktop && !selecting && songs && songs.length > 0 && (
				<Affix position={{ bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 16px)', right: 16 }}>
					<Button
						component={Link}
						to="/song/create"
						size="lg"
						radius="xl"
						leftSection={<IconPlus size={20} />}
						style={{ boxShadow: 'var(--mantine-shadow-lg)' }}
					>
						New
					</Button>
				</Affix>
			)}
		</>
	);
}
