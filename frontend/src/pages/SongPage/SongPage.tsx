import { useLoaderData, useNavigate } from 'react-router-dom';
import type { SongDto } from '../../types';
import { Viewer } from '../../features/song/components/Viewer/Viewer';
import { ActionIcon, Box, Button, Divider, Group, Menu, MultiSelect, Stack, Text, TextInput, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconPlaylistAdd } from '@tabler/icons-react';
import { CardHC } from '../../features/song/components/CardHC/CardHC';
import { BackButton } from '../../components';
import { useCloneSong, useDeleteSongs, useIsSongOwner } from '../../features/song/hooks/song';
import { useAuth } from 'react-oidc-context';
import {
	useAddSongToPlaylist,
	useCreatePlaylist,
	useMyPlaylistsWithDetails,
	useRemoveSongFromPlaylist,
} from '../../features/playlist/hooks/playlists';
import { useEffect, useMemo, useState } from 'react';

export function SongPage() {
	const songDto = useLoaderData() as SongDto;

	const { isAuthenticated, user } = useAuth();
	const me = user?.profile?.sub;
	const navigate = useNavigate();
	const isOwner = useIsSongOwner(songDto.authorId);

	const { cloneSong, isCloning } = useCloneSong({ navigateOnSuccess: true });
	const { deleteSongs, isDeleting } = useDeleteSongs();

	const handleDeleteSong = () => deleteSongs([songDto.id]);
	const handleEditSong = () => navigate(`/song/edit/${songDto.id}`);

	const { playlists: myPlaylists } = useMyPlaylistsWithDetails(isAuthenticated);
	const ownedPlaylists = useMemo(() => myPlaylists.filter((p) => p.ownerId === me), [myPlaylists, me]);
	const options = useMemo(
		() => ownedPlaylists.map((p) => ({ value: String(p.playlistId), label: p.title })),
		[ownedPlaylists],
	);
	const initiallySelected = useMemo(
		() =>
			ownedPlaylists.filter((p) => (p.songs ?? []).some((s) => s.id === songDto.id)).map((p) => String(p.playlistId)),
		[ownedPlaylists, songDto.id],
	);
	const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>(initiallySelected);

	useEffect(() => {
		if (!isAuthenticated) return;
		setSelectedPlaylists(initiallySelected);
	}, [initiallySelected, isAuthenticated]);

	const { addSongToPlaylist, isAdding } = useAddSongToPlaylist();
	const { removeSongFromPlaylist, isRemoving } = useRemoveSongFromPlaylist();
	const { createPlaylist, isCreating } = useCreatePlaylist();

	const onChangePlaylists = async (values: string[]) => {
		const prev = new Set(selectedPlaylists);
		const next = new Set(values);
		const toAdd = [...next].filter((id) => !prev.has(id));
		const toRemove = [...prev].filter((id) => !next.has(id));
		for (const id of toAdd) {
			await addSongToPlaylist(parseInt(id, 10), songDto.id);
		}
		for (const id of toRemove) {
			await removeSongFromPlaylist(parseInt(id, 10), songDto.id);
		}
		setSelectedPlaylists(values);
	};

	/**
	 * Opens a small "just a name" modal to create a new playlist and immediately
	 * adds the current song to it. Saves the user from navigating to /my-playlists,
	 * creating a playlist, navigating back, and then adding the song.
	 */
	const openQuickCreatePlaylist = () => {
		let title = '';
		const onSubmit = async () => {
			const trimmed = title.trim();
			if (!trimmed) return;
			const created = await createPlaylist({ title: trimmed, description: null });
			if (created?.id) {
				await addSongToPlaylist(created.id, songDto.id);
				setSelectedPlaylists((prev) => [...prev, String(created.id)]);
			}
			modals.closeAll();
		};
		modals.open({
			title: 'New playlist',
			size: 'sm',
			children: (
				<Stack gap="sm">
					<TextInput
						label="Playlist name"
						placeholder="My new playlist"
						autoFocus
						onChange={(e) => (title = e.currentTarget.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') void onSubmit();
						}}
					/>
					<Text size="xs" c="dimmed">
						"{songDto.name}" will be added to the new playlist automatically.
					</Text>
					<Group justify="flex-end" mt="xs">
						<Button variant="light" color="gray" onClick={() => modals.closeAll()}>
							Cancel
						</Button>
						<Button onClick={onSubmit} loading={isCreating || isAdding}>
							Create
						</Button>
					</Group>
				</Stack>
			),
		});
	};

	return (
		<>
			<Group justify="space-between" wrap="wrap">
				<Box style={{ flex: '1 1 260px', minWidth: 0 }}>
					<Text size="xl" fw={700} truncate>
						{songDto.name}
					</Text>
					<Text size="md" truncate>
						{songDto.artist}
					</Text>
				</Box>
				<Group wrap="nowrap" gap="xs">
					{isAuthenticated && (
						<>
							<MultiSelect
								data={options}
								value={selectedPlaylists}
								onChange={onChangePlaylists}
								searchable
								w={{ base: 160, xs: 200, sm: 260 }}
								disabled={isAdding || isRemoving}
								placeholder="Add to playlists..."
								className="hide-multiselect-tags"
							/>
							<Tooltip label="New playlist" withArrow>
								<ActionIcon
									variant="subtle"
									size="lg"
									onClick={openQuickCreatePlaylist}
									aria-label="Create new playlist and add this song"
								>
									<IconPlaylistAdd size={20} />
								</ActionIcon>
							</Tooltip>
						</>
					)}
					<BackButton />
				</Group>
			</Group>

			<Divider my="sm" />

			<Viewer
				musicText={songDto.content}
				defaultKey={songDto.rootNote}
				menuItems={[
					isAuthenticated && (
						<Menu.Item key="clone" disabled={isCloning} onClick={() => cloneSong(songDto.id)}>
							Clone
						</Menu.Item>
					),
					isOwner && (
						<Menu.Item key="edit" onClick={handleEditSong}>
							Edit
						</Menu.Item>
					),
					isOwner && (
						<Menu.Item key="delete" color="red" disabled={isDeleting} onClick={handleDeleteSong}>
							Delete
						</Menu.Item>
					),
				].filter(Boolean)}
			/>

			{songDto.description && songDto.description.trim() && (
				<>
					<Divider my="sm" label="Notes" labelPosition="left" />
					<Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
						{songDto.description}
					</Text>
				</>
			)}

			<Divider />

			{songDto.sourceUrl && <CardHC url={songDto.sourceUrl} name={songDto.name} artist={songDto.artist} />}
		</>
	);
}
