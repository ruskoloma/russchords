import { ActionIcon, Text, Tooltip } from '@mantine/core';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { IconGripVertical, IconX } from '@tabler/icons-react';
import type { LiteSongDto } from '../../../types';

/** Reorderable (drag handle) and removable playlist rows for edit mode. */
export default function EditableSongRows({
	songs,
	onChange,
}: {
	songs: LiteSongDto[];
	onChange: (songs: LiteSongDto[]) => void;
}) {
	const onDragEnd = ({ source, destination }: DropResult) => {
		if (!destination || destination.index === source.index) return;
		const next = songs.slice();
		const [moved] = next.splice(source.index, 1);
		next.splice(destination.index, 0, moved);
		onChange(next);
	};

	return (
		<DragDropContext onDragEnd={onDragEnd}>
			<Droppable droppableId="playlist-songs">
				{(dropProvided) => (
					<div className="list-surface" ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
						{songs.map((song, index) => (
							<Draggable key={song.id} draggableId={String(song.id)} index={index}>
								{(provided, snapshot) => (
									<div
										ref={provided.innerRef}
										{...provided.draggableProps}
										className="list-row"
										style={{
											...provided.draggableProps.style,
											background: snapshot.isDragging ? 'var(--app-surface)' : undefined,
											boxShadow: snapshot.isDragging ? 'var(--mantine-shadow-lg)' : undefined,
										}}
									>
										<ActionIcon
											size="lg"
											variant="subtle"
											aria-label={`Drag to reorder ${song.name}`}
											style={{ cursor: 'grab', touchAction: 'none' }}
											{...provided.dragHandleProps}
										>
											<IconGripVertical size={18} />
										</ActionIcon>
										<Text c="dimmed" fw={600} w={20} ta="right" style={{ flexShrink: 0 }}>
											{index + 1}
										</Text>
										<div className="list-row__main">
											<Text fw={600} truncate>
												{song.name}
											</Text>
											{song.artist && (
												<Text size="sm" c="dimmed" truncate>
													{song.artist}
												</Text>
											)}
										</div>
										<Tooltip label="Remove from playlist">
											<ActionIcon
												size="lg"
												color="red"
												variant="subtle"
												aria-label={`Remove ${song.name}`}
												onClick={() => onChange(songs.filter((s) => s.id !== song.id))}
											>
												<IconX size={18} />
											</ActionIcon>
										</Tooltip>
									</div>
								)}
							</Draggable>
						))}
						{dropProvided.placeholder}
					</div>
				)}
			</Droppable>
		</DragDropContext>
	);
}
