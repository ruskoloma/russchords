import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ActionIcon, Card, Group, Text } from '@mantine/core';
import { IconGripVertical, IconTrash } from '@tabler/icons-react';
import { Draggable } from '@hello-pangea/dnd';
import type { LiteSongDto } from '../../../types';

interface PlaylistSongRowProps {
	song: LiteSongDto;
	index: number;
	editing: boolean;
	isOwner: boolean;
	isRemoving: boolean;
	navigationUrl: string;
	onRemove: (songId: number) => void;
}

/**
 * A single row in the playlist song list. Wrapped in `React.memo` so a
 * drag-and-drop reorder only re-renders the rows whose props changed —
 * previously every reorder would re-render all N rows.
 */
export const PlaylistSongRow = memo(function PlaylistSongRow({
	song,
	index,
	editing,
	isOwner,
	isRemoving,
	navigationUrl,
	onRemove,
}: PlaylistSongRowProps) {
	return (
		<Draggable draggableId={song.id.toString()} index={index} isDragDisabled={!isOwner || !editing}>
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
						<Group wrap="nowrap" gap="sm" align="center" style={{ minWidth: 0, flex: 1 }}>
							{isOwner && editing && (
								<ActionIcon
									variant="subtle"
									{...draggableProvided.dragHandleProps}
									aria-label={`Drag ${song.name}`}
									style={{ cursor: 'grab' }}
								>
									<IconGripVertical size={18} />
								</ActionIcon>
							)}
							{editing ? (
								<Text fw={600} truncate="end" style={{ minWidth: 0, flex: 1 }}>
									{song.name}
								</Text>
							) : (
								<Text
									fw={600}
									truncate="end"
									style={{ minWidth: 0, flex: 1 }}
									component={Link}
									to={navigationUrl}
								>
									{song.name}
								</Text>
							)}
						</Group>
						{isOwner && editing && (
							<ActionIcon
								variant="subtle"
								color="red"
								aria-label={`Remove ${song.name}`}
								onClick={() => onRemove(song.id)}
								loading={isRemoving}
							>
								<IconTrash size={18} />
							</ActionIcon>
						)}
					</Group>
				</Card>
			)}
		</Draggable>
	);
});
