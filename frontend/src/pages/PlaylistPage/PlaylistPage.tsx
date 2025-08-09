import { useEffect, useState } from 'react';
import { useLoaderData } from 'react-router-dom';
import { ActionIcon, Button, Card, Group, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { IconChecks, IconGripVertical, IconPencil, IconX } from '@tabler/icons-react';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { useUpdatePlaylist } from '../../hooks/playlists';
import type { PlaylistWithSongs, SongDto } from '../../types';

export const PlaylistPage: React.FC = () => {
	const initial = useLoaderData() as PlaylistWithSongs;

	const [title, setTitle] = useState(initial.title);
	const [description, setDescription] = useState(initial.description ?? '');
	const [editing, setEditing] = useState(false);

	const [songs, setSongs] = useState<SongDto[]>(initial.songs ?? []);
	useEffect(() => setSongs(initial.songs ?? []), [initial.songs]);

	const { updatePlaylist, isUpdating } = useUpdatePlaylist();

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
		await updatePlaylist(initial.id, { title, description });
		setEditing(false);
	};

	const onCancelMeta = () => {
		setTitle(initial.title);
		setDescription(initial.description ?? '');
		setEditing(false);
	};

	// Заготовка — когда появится бэкенд для порядка, отправишь ids
	const onSaveOrder = async () => {
		const orderedIds = songs.map((s) => s.id);
		console.log('save order ->', orderedIds);
		// await client.post(`/api/playlist/${initial.id}/reorder`, { songIds: orderedIds });
	};

	return (
		<Stack gap="md">
			<Card withBorder shadow="sm">
				{!editing ? (
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
						<Button leftSection={<IconPencil size={16} />} onClick={() => setEditing(true)}>
							Edit
						</Button>
					</Group>
				) : (
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
				)}
			</Card>

			<Stack gap="xs">
				<Group justify="space-between">
					<Text fw={700}>Songs</Text>
					<Button variant="default" onClick={onSaveOrder}>
						Save order
					</Button>
				</Group>

				<DragDropContext onDragEnd={onDragEnd}>
					<Droppable droppableId="playlist-songs">
						{(provided) => (
							<Stack ref={provided.innerRef} {...provided.droppableProps}>
								{songs.length === 0 ? (
									<Text c="dimmed">No songs in this playlist</Text>
								) : (
									songs.map((song, index) => (
										<Draggable key={song.id} draggableId={song.id.toString()} index={index}>
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
													<Group justify="space-between">
														<Group>
															<ActionIcon variant="subtle" {...draggableProvided.dragHandleProps} aria-label="Drag">
																<IconGripVertical size={18} />
															</ActionIcon>
															<Text fw={600}>{song.name}</Text>
														</Group>
														<Text c="dimmed" size="sm">
															{song.artist ?? ''}
														</Text>
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
