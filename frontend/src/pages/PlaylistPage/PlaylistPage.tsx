import { useEffect, useMemo, useState } from 'react';
import { Link, useLoaderData, useNavigate, useLocation } from 'react-router-dom';
import { ActionIcon, Button, Card, Group, Stack, Text, Textarea, TextInput, MultiSelect, Tooltip } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import {
	IconArrowLeft,
	IconChecks,
	IconCopy,
	IconGripVertical,
	IconPencil,
	IconPin,
	IconPinFilled,
	IconPlayerPlay,
	IconTrash,
	IconX,
} from '@tabler/icons-react';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import {
	useAddPlaylistToMy,
	useIsPlaylistOwner,
	useRemoveSongFromPlaylist,
	useSavePlaylistOrder,
	useSetPlaylistPinned,
	useUpdatePlaylist,
	useAddSongToPlaylist,
	useMyPlaylistsWithDetails,
	useRemovePlaylistFromMy,
	useDeletePlaylist,
} from '../../hooks/playlists';
import { useMyLightSongs } from '../../hooks/song';
import type { LiteSongDto, MyPlaylistDto } from '../../types';
import { useAuth } from 'react-oidc-context';
import { createNavigationUrl } from '../../helpers/navigation';

export const PlaylistPage: React.FC = () => {
	const initial = useLoaderData() as MyPlaylistDto;
	const navigate = useNavigate();
	const location = useLocation();

	const [savedTitle, setSavedTitle] = useState(initial.title);
	const [savedDescription, setSavedDescription] = useState(initial.description ?? '');
	const [savedSongs, setSavedSongs] = useState<LiteSongDto[]>(initial.songs ?? []);
	const [savedPinned, setSavedPinned] = useState<boolean>(initial.isPinned);

	const [title, setTitle] = useState(savedTitle);
	const [description, setDescription] = useState(savedDescription);
	const [editing, setEditing] = useState(false);
	const [songs, setSongs] = useState<LiteSongDto[]>(savedSongs);
	const [pinned, setPinned] = useState<boolean>(savedPinned);
	const isOwner = useIsPlaylistOwner(initial.ownerId);
	const { isAuthenticated } = useAuth();
	const { addToMy, isAdding } = useAddPlaylistToMy();

	const { playlists } = useMyPlaylistsWithDetails(isAuthenticated);
	const isInMy = useMemo(
		() => playlists.some((p) => p.playlistId === initial.playlistId),
		[playlists, initial.playlistId],
	);

	const myMembershipId = useMemo(
		() => playlists.find((p) => p.playlistId === initial.playlistId)?.memberRecordId ?? null,
		[playlists, initial.playlistId],
	);

	const { removeFromMy, isRemovingFromMy } = useRemovePlaylistFromMy();

	const { updatePlaylist, isUpdating } = useUpdatePlaylist({ notifyOnSuccess: false });
	const { removeSongFromPlaylist, isRemoving } = useRemoveSongFromPlaylist({ notifyOnSuccess: false });
	const { saveOrder, isSaving } = useSavePlaylistOrder({ notifyOnSuccess: false });
	const { setPinned: setPinnedReq, isSetting } = useSetPlaylistPinned();
	const { deletePlaylist, isDeleting: isDeletingPlaylist } = useDeletePlaylist();

	const { songs: mySongs, isLoading: isLoadingMySongs } = useMyLightSongs(isAuthenticated);

	const mySongOptions = useMemo(
		() =>
			mySongs.map((s) => ({
				value: String(s.id),
				label: s.artist ? `${s.name} — ${s.artist}` : s.name,
			})),
		[mySongs],
	);

	const selectedIdsFromPlaylist = useMemo(
		() => songs.filter((s) => mySongs.some((ms) => ms.id === s.id)).map((s) => String(s.id)),
		[songs, mySongs],
	);

	const [selectedIds, setSelectedIds] = useState<string[]>(selectedIdsFromPlaylist);
	useEffect(() => {
		if (!isAuthenticated) return;
		setSelectedIds(selectedIdsFromPlaylist);
	}, [selectedIdsFromPlaylist, isAuthenticated]);

	const { addSongToPlaylist, isAdding: isAddingSong } = useAddSongToPlaylist({ notifyOnSuccess: false });

	useEffect(() => {
		setSavedTitle(initial.title);
		setSavedDescription(initial.description ?? '');
		setSavedSongs(initial.songs ?? []);
		setSavedPinned(initial.isPinned);
	}, [initial.title, initial.description, initial.songs, initial.isPinned]);

	useEffect(() => {
		if (editing) return;
		setTitle(savedTitle);
		setDescription(savedDescription);
		setSongs(savedSongs);
		setPinned(savedPinned);
	}, [editing, savedTitle, savedDescription, savedSongs, savedPinned]);

	const onChangeSelected = (values: string[]) => {
		const prev = new Set(selectedIds);
		const next = new Set(values);

		const toAdd = [...next].filter((id) => !prev.has(id));
		const toRemove = [...prev].filter((id) => !next.has(id));

		for (const idStr of toAdd) {
			const id = parseInt(idStr, 10);
			const added = mySongs.find((s) => s.id === id);
			if (added) {
				setSongs((prevSongs) => (prevSongs.some((s) => s.id === id) ? prevSongs : [...prevSongs, added]));
			}
		}

		for (const idStr of toRemove) {
			const id = parseInt(idStr, 10);
			setSongs((prevSongs) => prevSongs.filter((s) => s.id !== id));
		}

		setSelectedIds(values);
	};

	const onDragEnd = (result: DropResult) => {
		const { source, destination } = result;
		if (!destination) return;
		if (source.index === destination.index) return;
		setSongs((prev) => {
			const next = prev.slice();
			const [moved] = next.splice(source.index, 1);
			next.splice(destination.index, 0, moved);
			return next;
		});
	};

	const onSaveMeta = async () => {
		const beforeIds = savedSongs.map((s) => s.id);
		const afterIds = songs.map((s) => s.id);
		const beforeSet = new Set(beforeIds);
		const afterSet = new Set(afterIds);

		const toAdd = afterIds.filter((id) => !beforeSet.has(id));
		const toRemove = beforeIds.filter((id) => !afterSet.has(id));

		const metaChanged = title !== savedTitle || description !== savedDescription;
		const orderChanged =
			beforeIds.length !== afterIds.length || beforeIds.some((id, idx) => afterIds[idx] !== id);
		const pinChanged = pinned !== savedPinned;

		if (!metaChanged && !orderChanged && !pinChanged && toAdd.length === 0 && toRemove.length === 0) {
			setEditing(false);
			return;
		}

		if (metaChanged) {
			await updatePlaylist(initial.playlistId, { title, description });
		}
		for (const songId of toRemove) {
			await removeSongFromPlaylist(initial.playlistId, songId);
		}
		for (const songId of toAdd) {
			await addSongToPlaylist(initial.playlistId, songId);
		}
		if (orderChanged || toAdd.length > 0 || toRemove.length > 0) {
			await saveOrder(initial.playlistId, afterIds);
		}
		if (pinChanged) {
			await setPinnedReq(initial.playlistId, pinned);
		}

		setSavedTitle(title);
		setSavedDescription(description);
		setSavedSongs(songs);
		setSavedPinned(pinned);
		setEditing(false);
		showNotification({
			title: 'Playlist updated',
			message: 'Changes saved.',
			color: 'green',
		});
	};

	const onCancelMeta = () => {
		setTitle(savedTitle);
		setDescription(savedDescription);
		setSongs(savedSongs);
		setPinned(savedPinned);
		setEditing(false);
	};



	const togglePin = () => {
		setPinned((prev) => !prev);
	};

	const removeByButton = (songId: number) => {
		setSongs((prev) => prev.filter((s) => s.id !== songId));
		setSelectedIds((prev) => prev.filter((id) => parseInt(id, 10) !== songId));
	};

	const onDeletePlaylist = () => {
		modals.openConfirmModal({
			title: 'Delete playlist',
			children: <Text size="sm">Are you sure you want to delete this playlist? This action cannot be undone.</Text>,
			labels: { confirm: 'Delete', cancel: 'Cancel' },
			confirmProps: { color: 'red' },
			onConfirm: async () => {
				await deletePlaylist(initial.playlistId);
				navigate('/my-playlists');
			},
		});
	};

	const hasSongs = useMemo(() => songs.length > 0, [songs]);

	return (
		<Stack gap="md">
			{!editing && isAuthenticated && (
				<Group>
					<Button
						component={Link}
						to="/my-playlists"
						variant="subtle"
						color="gray"
						size="sm"
						leftSection={<IconArrowLeft size={16} />}
					>
						My Playlists
					</Button>
				</Group>
			)}
			{editing && isOwner && (
				<Group justify="flex-end">
					<Button
						variant="subtle"
						color="red"
						leftSection={<IconTrash size={16} />}
						onClick={onDeletePlaylist}
						loading={isDeletingPlaylist}
					>
						Delete playlist
					</Button>
					<Button
						variant="default"
						onClick={togglePin}
						loading={isSetting}
						leftSection={pinned ? <IconPinFilled size={16} /> : <IconPin size={16} />}
					>
						{pinned ? 'Unpin' : 'Pin'}
					</Button>
				</Group>
			)}

			<Card withBorder shadow="sm" p={0}>
				{editing && isOwner ? (
					<Stack gap="sm" p="md">
						<TextInput label="Title" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
						<Textarea
							label="Description"
							value={description}
							onChange={(e) => setDescription(e.currentTarget.value)}
							autosize
							minRows={3}
						/>
					</Stack>
				) : (
					<Group justify="space-between" align="flex-start" p="md">
						<Stack gap={4}>
							<Text fw={800} size="xl">
								{title}
							</Text>
							{description ? (
								<Text c="dimmed">{description}</Text>
							) : (
								<Text c="dimmed" fs="italic">
									No description
								</Text>
							)}
						</Stack>
						<Group>
							{hasSongs && (
								<Button leftSection={<IconPlayerPlay size={16} />} component={Link} to={`play`}>
									Play
								</Button>
							)}
							<Button
								variant="default"
								leftSection={<IconCopy size={16} />}
								onClick={async () => {
									await navigator.clipboard.writeText(window.location.href);
									showNotification({
										title: 'Copied',
										message: 'Playlist link copied to clipboard',
										color: 'green',
										autoClose: 500,
									});
								}}
							>
								Share
							</Button>
							{isOwner && (
								<>
									<Button leftSection={<IconPencil size={16} />} onClick={() => setEditing(true)}>
										Edit
									</Button>
								</>
							)}
						</Group>
					</Group>
				)}
			</Card>

			<Stack gap="xs">
				<Group justify="space-between" align="center">
					<Group gap="xs">
						<Text fw={700}>Songs</Text>
						<Tooltip label="Copy song list" withArrow>
							<ActionIcon
								variant="subtle"
								color="gray"
								size="sm"
								onClick={() => {
									const text = songs.map((s) => s.name).join('\n');
									navigator.clipboard.writeText(text);
									showNotification({
										title: 'Copied',
										message: 'Song list copied to clipboard',
										color: 'green',
										autoClose: 500,
									});
								}}
							>
								<IconCopy size={16} />
							</ActionIcon>
						</Tooltip>
					</Group>
					<Group>
						{isAuthenticated && isOwner && editing && (
							<MultiSelect
								placeholder="Add/remove my songs..."
								data={mySongOptions}
								value={selectedIds}
								onChange={onChangeSelected}
								searchable
								disabled={isLoadingMySongs || isAddingSong || isRemoving}
								w={320}
								className="hide-multiselect-tags"
							/>
						)}
						{isAuthenticated &&
							!isOwner &&
							(isInMy ? (
								<Button
									variant="light"
									color="red"
									onClick={() => myMembershipId != null && removeFromMy(myMembershipId)}
									disabled={myMembershipId == null}
									loading={isRemovingFromMy}
								>
									Remove from my
								</Button>
							) : (
								<Button variant="filled" onClick={() => addToMy(initial.playlistId)} loading={isAdding}>
									Add to my
								</Button>
							))}
					</Group>
				</Group>

				<DragDropContext onDragEnd={onDragEnd}>
					<Droppable droppableId="playlist-songs">
						{(provided) => (
							<Stack ref={provided.innerRef} {...provided.droppableProps}>
								{!hasSongs ? (
									<Text c="dimmed">No songs in this playlist</Text>
								) : (
									songs.map((song, index) => (
										<Draggable
											key={song.id}
											draggableId={song.id.toString()}
											index={index}
											isDragDisabled={!isOwner || !editing}
										>
											{(draggableProvided, snapshot) => (
												<Card
													withBorder
													shadow={snapshot.isDragging ? 'md' : 'xs'}
													ref={draggableProvided.innerRef}
													{...draggableProvided.draggableProps}
													style={{
														...draggableProvided.draggableProps.style,
														opacity: snapshot.isDragging ? 0.95 : 1,
													}}
												>
													<Group justify="space-between" wrap="nowrap" align="center">
														<Group
															wrap="nowrap"
															gap="sm"
															align="center"
															style={{ minWidth: 0, flex: 1 }}
														>
															{isOwner && editing && (
																<ActionIcon
																	variant="subtle"
																	{...draggableProvided.dragHandleProps}
																	aria-label="Drag"
																	style={{ cursor: 'grab' }}
																>
																	<IconGripVertical size={18} />
																</ActionIcon>
															)}
															{editing ? (
																<Text fw={600} truncate="end" style={{ minWidth: 0, flex: 1, cursor: 'default' }}>
																	{song.name}
																</Text>
															) : (
																<Text
																	fw={600}
																	truncate="end"
																	style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}
																	component={Link}
																	to={createNavigationUrl(`/song/${song.id}`, location)}
																>
																	{song.name}
																</Text>
															)}
														</Group>
														{isOwner && editing && (
															<ActionIcon
																variant="subtle"
																color="red"
																aria-label="Remove"
																onClick={() => removeByButton(song.id)}
																loading={isRemoving}
															>
																<IconTrash size={18} />
															</ActionIcon>
														)}
													</Group>
												</Card>
											)}
										</Draggable>
									))
								)}
								{provided.placeholder}
							</Stack>
						)}
					</Droppable>
				</DragDropContext>

				{editing && isOwner && (
					<Group justify="flex-end" mt="md">
						<Button
							variant="default"
							color="gray"
							leftSection={<IconX size={16} />}
							onClick={onCancelMeta}
							disabled={isUpdating || isAddingSong || isRemoving || isSaving || isSetting}
						>
							Cancel
						</Button>
						<Button
							leftSection={<IconChecks size={16} />}
							onClick={onSaveMeta}
							loading={isUpdating || isAddingSong || isRemoving || isSaving || isSetting}
						>
							Save changes
						</Button>
					</Group>
				)}
			</Stack>
		</Stack>
	);
};
