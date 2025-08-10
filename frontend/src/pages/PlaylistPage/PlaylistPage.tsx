import { useEffect, useMemo, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { ActionIcon, Button, Card, Group, Stack, Text, Textarea, TextInput } from '@mantine/core';
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
} from '../../hooks/playlists';
import type { LiteSong, MyPlaylistDto } from '../../types';
import { useAuth } from 'react-oidc-context';

export const PlaylistPage: React.FC = () => {
	const initial = useLoaderData() as MyPlaylistDto;
	const navigate = useNavigate();

	const [title, setTitle] = useState(initial.title);
	const [description, setDescription] = useState(initial.description ?? '');
	const [editing, setEditing] = useState(false);

	const [songs, setSongs] = useState<LiteSong[]>(initial.songs ?? []);
	useEffect(() => setSongs(initial.songs ?? []), [initial.songs]);

	const [pinned, setPinned] = useState<boolean>(initial.isPinned);
	const isOwner = useIsPlaylistOwner(initial.ownerId);
	const { isAuthenticated } = useAuth();
	const { addToMy, isAdding } = useAddPlaylistToMy();

	const { updatePlaylist, isUpdating } = useUpdatePlaylist();
	const { removeSongFromPlaylist, isRemoving } = useRemoveSongFromPlaylist();
	const { saveOrder, isSaving } = useSavePlaylistOrder();
	const { setPinned: setPinnedReq, isSetting } = useSetPlaylistPinned();

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
				try {
					await removeSongFromPlaylist(initial.playlistId, songId);
				} catch {}
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
						{isAuthenticated && !isOwner && (
							<Button variant="filled" onClick={() => addToMy(initial.playlistId)} loading={isAdding}>
								Add to my
							</Button>
						)}
						{isAuthenticated && isOwner && (
							<Button variant="default" onClick={onSaveOrder} loading={isSaving}>
								Save order
							</Button>
						)}
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
