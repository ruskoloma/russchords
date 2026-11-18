import { useMemo, useState } from 'react';
import { Button, Checkbox, Loader, Modal, Popover, ScrollArea, Stack, Text, TextInput, Group } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconPlaylistAdd, IconPlus, IconSearch } from '@tabler/icons-react';
import { useCreatePlaylist, useMyPlaylists, useTogglePlaylistSong } from '../../../api/playlists';
import { useSession } from '../../../auth/useSession';
import type { LiteSongDto } from '../../../types';
import { notifySuccess } from '../../../lib/notify';

function PickerBody({ song }: { song: LiteSongDto }) {
	const { userId } = useSession();
	const { data: playlists, isPending } = useMyPlaylists();
	const toggle = useTogglePlaylistSong();
	const create = useCreatePlaylist();
	const [query, setQuery] = useState('');

	const owned = useMemo(
		() =>
			(playlists ?? [])
				.filter((p) => p.ownerId === userId)
				.sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || a.title.localeCompare(b.title)),
		[playlists, userId],
	);

	const q = query.trim().toLowerCase();
	const visible = q ? owned.filter((p) => p.title.toLowerCase().includes(q)) : owned;
	const canCreate = q.length > 0 && !owned.some((p) => p.title.toLowerCase() === q);

	const createAndAdd = async () => {
		const title = query.trim();
		if (!title) return;
		const created = await create.mutateAsync({ title, description: null });
		await toggle.mutateAsync({ playlistId: created.id, song, add: true });
		setQuery('');
		notifySuccess(`Added to “${title}”`);
	};

	return (
		<Stack gap="xs">
			<TextInput
				placeholder="Find or create a playlist"
				value={query}
				onChange={(e) => setQuery(e.currentTarget.value)}
				leftSection={<IconSearch size={16} />}
				onKeyDown={(e) => {
					if (e.key === 'Enter' && canCreate) void createAndAdd();
				}}
				data-autofocus
			/>
			{isPending ? (
				<Group justify="center" py="md">
					<Loader size="sm" />
				</Group>
			) : (
				<ScrollArea.Autosize mah={300} type="auto" offsetScrollbars>
					<Stack gap={2}>
						{canCreate && (
							<Button
								variant="light"
								justify="flex-start"
								fullWidth
								leftSection={<IconPlus size={18} />}
								loading={create.isPending || toggle.isPending}
								onClick={() => void createAndAdd()}
							>
								<Text size="sm" fw={600} truncate>
									Create “{query.trim()}”
								</Text>
							</Button>
						)}
						{visible.map((p) => {
							const checked = p.songs.some((s) => s.id === song.id);
							return (
								<Checkbox
									key={p.playlistId}
									label={p.title}
									checked={checked}
									onChange={() => toggle.mutate({ playlistId: p.playlistId, song, add: !checked })}
									size="md"
									px="xs"
									py={8}
									styles={{ label: { cursor: 'pointer' }, input: { cursor: 'pointer' } }}
								/>
							);
						})}
						{!canCreate && visible.length === 0 && (
							<Text size="sm" c="dimmed" px="xs" py="sm">
								{owned.length === 0 ? 'No playlists yet — type a name to create one.' : 'No matches.'}
							</Text>
						)}
					</Stack>
				</ScrollArea.Autosize>
			)}
		</Stack>
	);
}

/** "Add to playlist" control: popover on desktop, dialog on phones. */
export function AddToPlaylistButton({ song, compact = false }: { song: LiteSongDto; compact?: boolean }) {
	const [opened, { close, toggle }] = useDisclosure(false);
	const isDesktop = useMediaQuery('(min-width: 48em)', true, { getInitialValueInEffect: false });

	const trigger = (
		<Button
			variant="default"
			leftSection={<IconPlaylistAdd size={18} />}
			onClick={toggle}
			aria-label="Add to playlist"
			px={compact ? 'sm' : undefined}
		>
			{compact ? 'Playlist' : 'Add to playlist'}
		</Button>
	);

	if (!isDesktop) {
		return (
			<>
				{trigger}
				<Modal opened={opened} onClose={close} title="Add to playlist" size="md">
					<PickerBody song={song} />
				</Modal>
			</>
		);
	}

	return (
		<Popover opened={opened} onChange={(o) => !o && close()} width={320} position="bottom-end" shadow="md" trapFocus>
			<Popover.Target>{trigger}</Popover.Target>
			<Popover.Dropdown p="xs">
				<PickerBody song={song} />
			</Popover.Dropdown>
		</Popover>
	);
}
