import { useLoaderData, useNavigate } from 'react-router-dom';
import type { SongDto } from '../../types';
import { Viewer } from '../../components/Viewer/Viewer';
import { ActionIcon, Box, Divider, Group, Menu, Text, MultiSelect } from '@mantine/core';
import { CardHC } from '../../components/CardHC/CardHC';
import { useCloneSong, useDeleteSongs, useIsSongOwner } from '../../hooks/song';
import { useStarredState } from '../../hooks/starred';
import { IconStar, IconStarFilled } from '@tabler/icons-react';
import { useAuth } from 'react-oidc-context';
import { useMyPlaylistsWithDetails, useAddSongToPlaylist, useRemoveSongFromPlaylist } from '../../hooks/playlists';
import { useEffect, useMemo, useState } from 'react';

export function SongPage() {
	const songDto = useLoaderData() as SongDto;

	const auth = useAuth();
	const navigate = useNavigate();
	const isAuthenticated = Boolean(auth?.isAuthenticated);
	const isOwner = useIsSongOwner(songDto.authorId);

	const { isStarred, isLoading, unstarSong, starSong } = useStarredState(songDto.id);

	const { cloneSong, isCloning } = useCloneSong({ navigateOnSuccess: true });
	const { deleteSongs, isDeleting } = useDeleteSongs();

	const handleDeleteSong = () => deleteSongs([songDto.id]);
	const handleEditSong = () => navigate(`/song/edit/${songDto.id}`);

	const { playlists: myPlaylists } = useMyPlaylistsWithDetails(isAuthenticated);
	const options = useMemo(
		() => myPlaylists.map((p) => ({ value: String(p.playlistId), label: p.title })),
		[myPlaylists],
	);
	const initiallySelected = useMemo(
		() => myPlaylists.filter((p) => (p.songs ?? []).some((s) => s.id === songDto.id)).map((p) => String(p.playlistId)),
		[myPlaylists, songDto.id],
	);
	const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>(initiallySelected);

	useEffect(() => {
		if (!isAuthenticated) return;
		setSelectedPlaylists(initiallySelected);
	}, [initiallySelected, isAuthenticated]);

	const { addSongToPlaylist, isAdding } = useAddSongToPlaylist();
	const { removeSongFromPlaylist, isRemoving } = useRemoveSongFromPlaylist();
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

	return (
		<>
			<Group justify="space-between">
				<Box>
					<Text size="xl" fw={700}>
						{songDto.name}
					</Text>
					<Text size="md">{songDto.artist}</Text>
				</Box>
				<Group>
					{isAuthenticated && (
						<MultiSelect
							data={options}
							value={selectedPlaylists}
							onChange={onChangePlaylists}
							searchable
							w={280}
							disabled={isAdding || isRemoving}
							placeholder="Add to playlists..."
							className="hide-multiselect-tags"
						/>
					)}
					{isAuthenticated && (
						<ActionIcon
							variant={'subtle'}
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

			<Divider />

			<CardHC url={songDto.sourceUrl ?? ''} name={songDto.name} artist={songDto.artist} />
		</>
	);
}
