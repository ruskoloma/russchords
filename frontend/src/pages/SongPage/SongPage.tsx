import { useLoaderData, useNavigate, useSearchParams } from 'react-router-dom';
import type { SongDto } from '../../types';
import { Viewer } from '../../components/Viewer/Viewer';
import { ActionIcon, Box, Divider, Group, Menu, Text, MultiSelect } from '@mantine/core';
import { CardHC } from '../../components/CardHC/CardHC';
import { BackButton } from '../../components';
import { useCloneSong, useDeleteSongs, useIsSongOwner } from '../../hooks/song';
import { useStarredState } from '../../hooks/starred';
import { IconStar, IconStarFilled } from '@tabler/icons-react';
import { useAuth } from 'react-oidc-context';
import { useMyPlaylistsWithDetails, useAddSongToPlaylist, useRemoveSongFromPlaylist } from '../../hooks/playlists';
import { useEffect, useMemo, useState } from 'react';
import { useSourceContext } from '../../contexts/SourceContext';

export function SongPage() {
	const songDto = useLoaderData() as SongDto;

	const { isAuthenticated, user } = useAuth();
	const me = user?.profile?.sub;
	const navigate = useNavigate();
	const isOwner = useIsSongOwner(songDto.authorId);
	const [searchParams] = useSearchParams();
	const { setLastSongPageSource } = useSourceContext();

	const { isStarred, isLoading, unstarSong, starSong } = useStarredState(songDto.id);

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

	// Store the source in context when this song page loads
	useEffect(() => {
		const source = searchParams.get('source');
		if (source) {
			setLastSongPageSource(source);
		}
	}, [searchParams, setLastSongPageSource]);

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
				<Box maw={'350px'}>
					<Text size="xl" fw={700} truncate>
						{songDto.name}
					</Text>
					<Text size="md" truncate>{songDto.artist}</Text>
				</Box>
				<Group wrap="nowrap" maw={'100%'}>
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
					{isAuthenticated && (
						<MultiSelect
							data={options}
							value={selectedPlaylists}
							onChange={onChangePlaylists}
							searchable
							miw={200}
							maw={280}
							disabled={isAdding || isRemoving}
							placeholder="Add to playlists..."
							className="hide-multiselect-tags"
							flex={'0 1 auto'}
						/>
					)}
					<Box flex={'0 0'}>
						<BackButton /></Box>
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

			{songDto.sourceUrl && <CardHC url={songDto.sourceUrl} name={songDto.name} artist={songDto.artist} />}
		</>
	);
}
