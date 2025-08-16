import { useEffect, useMemo, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { ActionIcon, Button, Card, Group, Stack, Text, Textarea, TextInput, MultiSelect } from '@mantine/core';
import { modals } from '@mantine/modals';
import {
	IconChecks,
	IconGripVertical,
	IconPencil,
	IconPin,
	IconPinFilled,
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
} from '../../hooks/playlists';
import { useMyLightSongs } from '../../hooks/song';
import type { LiteSongDto, MyPlaylistDto } from '../../types';
import { useAuth } from 'react-oidc-context';

export const PlaylistPage: React.FC = () => {
	const initial = useLoaderData() as MyPlaylistDto;
	const navigate = useNavigate();

	const [title, setTitle] = useState(initial.title);
	const [description, setDescription] = useState(initial.description ?? '');
	const [editing, setEditing] = useState(false);

	const [songs, setSongs] = useState<LiteSongDto[]>(initial.songs ?? []);
	useEffect(() => setSongs(initial.songs ?? []), [initial.songs]);

	const [pinned, setPinned] = useState<boolean>(initial.isPinned);
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

	const { updatePlaylist, isUpdating } = useUpdatePlaylist();
	const { removeSongFromPlaylist, isRemoving } = useRemoveSongFromPlaylist();
	const { saveOrder, isSaving } = useSavePlaylistOrder();
	const { setPinned: setPinnedReq, isSetting } = useSetPlaylistPinned();

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

	const { addSongToPlaylist, isAdding: isAddingSong } = useAddSongToPlaylist();

	const onChangeSelected = async (values: string[]) => {
		const prev = new Set(selectedIds);
		const next = new Set(values);

		const toAdd = [...next].filter((id) => !prev.has(id));
		const toRemove = [...prev].filter((id) => !next.has(id));

		for (const idStr of toAdd) {
			const id = parseInt(idStr, 10);

			await addSongToPlaylist(initial.playlistId, id);
			const added = mySongs.find((s) => s.id === id);
			if (added) setSongs((prevSongs) => [...prevSongs, added]);
		}

		for (const idStr of toRemove) {
			const id = parseInt(idStr, 10);

			await removeSongFromPlaylist(initial.playlistId, id);
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
		await updatePlaylist(initial.playlistId, { title, description });
		setEditing(false);
	};

	const onCancelMeta = () => {
		setTitle(initial.title);
		setDescription(initial.description ?? '');
		setEditing(false);
	};

	const onSaveOrder = async () => {
		const orderedIds = songs.map((s) => s.id);
		await saveOrder(initial.playlistId, orderedIds);
	};

	const togglePin = async () => {
		const next = !pinned;
		setPinned(next);
		try {
			await setPinnedReq(initial.playlistId, next);
		} catch {
			setPinned(!next);
		}
	};

	const removeByButton = (songId: number) => {
		modals.openConfirmModal({
			title: 'Remove song',
			children: <Text size="sm">Are you sure you want to remove this song from the playlist?</Text>,
			labels: { confirm: 'Remove', cancel: 'Cancel' },
			confirmProps: { color: 'red' },
			onConfirm: async () => {
				setSongs((prev) => prev.filter((s) => s.id !== songId));

				await removeSongFromPlaylist(initial.playlistId, songId);
			},
		});
	};

	const hasSongs = useMemo(() => songs.length > 0, [songs]);

	return (
		<Stack gap="md">
			<Card withBorder shadow="sm">
				{editing && isOwner ? (
					<Stack gap="sm">
						<TextInput label="Title" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
						<Textarea
							label="Description"
							value={description}
							onChange={(e) => setDescription(e.currentTarget.value)}
							autosize
							minRows={3}
						/>
						<Group>
							<Button leftSection={<IconChecks size={16} />} onClick={onSaveMeta} loading={isUpdating}>
								Save
							</Button>
							<Button variant="light" color="gray" leftSection={<IconX size={16} />} onClick={onCancelMeta}>
								Cancel
							</Button>
						</Group>
					</Stack>
				) : (
					<Group justify="space-between" align="flex-start">
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
						{isOwner && (
							<Button leftSection={<IconPencil size={16} />} onClick={() => setEditing(true)}>
								Edit
							</Button>
						)}
					</Group>
				)}
			</Card>

			<Stack gap="xs">
				<Group justify="space-between" align="center">
					<Text fw={700}>Songs</Text>
					<Group>
						{isAuthenticated && isOwner && (
							<>
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
								<Button variant="default" onClick={onSaveOrder} loading={isSaving}>
									Save order
								</Button>
							</>
						)}
						{isAuthenticated && (
							<Button
								variant="default"
								onClick={togglePin}
								loading={isSetting}
								leftSection={pinned ? <IconPinFilled size={16} /> : <IconPin size={16} />}
							>
								{pinned ? 'Unpin' : 'Pin'}
							</Button>
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
										<Draggable key={song.id} draggableId={song.id.toString()} index={index} isDragDisabled={!isOwner}>
											{(draggableProvided, snapshot) => (
												<Card
													withBorder
													shadow={snapshot.isDragging ? 'md' : 'xs'}
													ref={draggableProvided.innerRef}
													{...draggableProvided.draggableProps}
													style={{ ...draggableProvided.draggableProps.style, opacity: snapshot.isDragging ? 0.95 : 1 }}
												>
													<Group justify="space-between" wrap="nowrap" align="center">
														<Group wrap="nowrap" gap="sm" align="center" style={{ minWidth: 0, flex: 1 }}>
															{isOwner && (
																<ActionIcon variant="subtle" {...draggableProvided.dragHandleProps} aria-label="Drag">
																	<IconGripVertical size={18} />
																</ActionIcon>
															)}
															<Text
																fw={600}
																truncate="end"
																style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}
																onClick={() => navigate(`/song/${song.id}`)}
															>
																{song.name}
															</Text>
														</Group>
														<Group wrap="nowrap" gap="sm" align="center" style={{ minWidth: 0, flex: 1.6 }}>
															<Text
																c="dimmed"
																size="sm"
																lineClamp={1}
																style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}
																onClick={() => navigate(`/song/${song.id}`)}
															>
																{song.artist ?? ''}
															</Text>
															{isOwner && (
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
			</Stack>
		</Stack>
	);
};
