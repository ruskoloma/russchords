import { useLoaderData, useNavigate } from 'react-router-dom';
import type { SongDto } from '../../types';
import { Viewer } from '../../features/song/components/Viewer/Viewer';
import { Badge, Box, Divider, Group, Menu, MultiSelect, Text } from '@mantine/core';
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
import { useCallback, useEffect, useMemo, useState } from 'react';

const CREATE_PREFIX = '__create__:';

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
	const baseOptions = useMemo(
		() => ownedPlaylists.map((p) => ({ value: String(p.playlistId), label: p.title })),
		[ownedPlaylists],
	);
	const initiallySelected = useMemo(
		() =>
			ownedPlaylists.filter((p) => (p.songs ?? []).some((s) => s.id === songDto.id)).map((p) => String(p.playlistId)),
		[ownedPlaylists, songDto.id],
	);
	const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>(initiallySelected);
	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		if (!isAuthenticated) return;
		setSelectedPlaylists(initiallySelected);
	}, [initiallySelected, isAuthenticated]);

	// Build options dynamically: real playlists + a "Create ..." virtual entry
	// when the search text doesn't match any existing playlist name.
	const options = useMemo(() => {
		const trimmed = searchQuery.trim();
		if (!trimmed) return baseOptions;
		const matchesExisting = baseOptions.some(
			(o) => o.label.toLowerCase() === trimmed.toLowerCase(),
		);
		if (matchesExisting) return baseOptions;
		return [
			{ value: `${CREATE_PREFIX}${trimmed}`, label: `Create "${trimmed}"` },
			...baseOptions,
		];
	}, [baseOptions, searchQuery]);

	const { addSongToPlaylist, isAdding } = useAddSongToPlaylist();
	const { removeSongFromPlaylist, isRemoving } = useRemoveSongFromPlaylist();
	const { createPlaylist } = useCreatePlaylist();

	const onChangePlaylists = useCallback(
		async (values: string[]) => {
			// Check if the user clicked the "Create ..." virtual option.
			const createEntry = values.find((v) => v.startsWith(CREATE_PREFIX));
			if (createEntry) {
				const name = createEntry.slice(CREATE_PREFIX.length);
				const created = await createPlaylist({ title: name, description: null });
				if (created?.id) {
					await addSongToPlaylist(created.id, songDto.id);
					setSelectedPlaylists((prev) => [...prev, String(created.id)]);
				}
				setSearchQuery('');
				return;
			}

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
		},
		[selectedPlaylists, addSongToPlaylist, removeSongFromPlaylist, createPlaylist, songDto.id],
	);

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
						<MultiSelect
							data={options}
							value={selectedPlaylists}
							onChange={onChangePlaylists}
							searchable
							searchValue={searchQuery}
							onSearchChange={setSearchQuery}
							w={{ base: 180, xs: 220, sm: 280 }}
							disabled={isAdding || isRemoving}
							placeholder="Add to playlists..."
							className="hide-multiselect-tags"
							nothingFoundMessage="Type to create a new playlist"
						/>
					)}
					<BackButton />
				</Group>
			</Group>

			{songDto.tags && songDto.tags.length > 0 && (
				<Group gap={6} mt={4}>
					{songDto.tags.map((t) => (
						<Badge key={t} variant="light" color="brand" size="sm" radius="sm">
							{t}
						</Badge>
					))}
				</Group>
			)}

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
