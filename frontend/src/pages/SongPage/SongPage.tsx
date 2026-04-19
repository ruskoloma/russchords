import { useLoaderData, useNavigate } from 'react-router-dom';
import type { SongDto } from '../../types';
import { Viewer } from '../../features/song/components/Viewer/Viewer';
import { ActionIcon, Badge, Box, Divider, Group, Menu, MultiSelect, Text } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { CardHC } from '../../features/song/components/CardHC/CardHC';
import { BackButton } from '../../components';
import { useCloneSong, useDeleteSongs, useIsSongOwner } from '../../features/song/hooks/song';
import { useStarredState } from '../../features/song/hooks/starred';
import { useAuth } from 'react-oidc-context';
import {
	useAddSongToPlaylist,
	useCreatePlaylist,
	useMyPlaylistsWithDetails,
	useRemoveSongFromPlaylist,
} from '../../features/playlist/hooks/playlists';
import { IconCopy, IconStar, IconStarFilled } from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const CREATE_PREFIX = '__create__:';

export function SongPage() {
	const songDto = useLoaderData() as SongDto;

	const { isAuthenticated, user } = useAuth();
	const me = user?.profile?.sub;
	const navigate = useNavigate();
	const isOwner = useIsSongOwner(songDto.authorId);

	const { isStarred, isLoading, unstarSong, starSong } = useStarredState(songDto.id);
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

	const options = useMemo(() => {
		const trimmed = searchQuery.trim();
		if (!trimmed) return baseOptions;
		const matchesExisting = baseOptions.some((o) => o.label.toLowerCase() === trimmed.toLowerCase());
		if (matchesExisting) return baseOptions;
		return [{ value: `${CREATE_PREFIX}${trimmed}`, label: `Create "${trimmed}"` }, ...baseOptions];
	}, [baseOptions, searchQuery]);

	const { addSongToPlaylist, isAdding } = useAddSongToPlaylist();
	const { removeSongFromPlaylist, isRemoving } = useRemoveSongFromPlaylist();
	const { createPlaylist } = useCreatePlaylist();

	const onChangePlaylists = useCallback(
		async (values: string[]) => {
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
						<ActionIcon
							variant="subtle"
							color="yellow"
							onClick={isStarred ? unstarSong : starSong}
							disabled={isLoading}
							aria-label={isStarred ? 'Unstar' : 'Star'}
							w={36}
							h={36}
						>
							{isStarred ? <IconStarFilled size={24} /> : <IconStar size={24} />}
						</ActionIcon>
					)}
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
					<Menu.Item
						key="share"
						leftSection={<IconCopy size={16} />}
						onClick={async () => {
							await navigator.clipboard.writeText(window.location.href);
							showNotification({
								title: 'Copied',
								message: 'Song link copied to clipboard',
								color: 'green',
								autoClose: 500,
							});
						}}
					>
						Share
					</Menu.Item>,
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
