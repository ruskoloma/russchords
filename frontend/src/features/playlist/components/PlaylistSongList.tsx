import type { Location } from 'react-router-dom';
import type { DropResult } from '@hello-pangea/dnd';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Stack, Text } from '@mantine/core';
import type { LiteSongDto } from '../../../types';
import { createNavigationUrl } from '../../../lib/navigation';
import { PlaylistSongRow } from './PlaylistSongRow';

interface PlaylistSongListProps {
	songs: LiteSongDto[];
	editing: boolean;
	isOwner: boolean;
	isRemoving: boolean;
	location: Location;
	onDragEnd: (result: DropResult) => void;
	onRemoveSong: (songId: number) => void;
}

/**
 * The drag-and-drop-enabled list of songs on the playlist page. Delegates
 * row rendering to the memoized `PlaylistSongRow`.
 */
export function PlaylistSongList({
	songs,
	editing,
	isOwner,
	isRemoving,
	location,
	onDragEnd,
	onRemoveSong,
}: PlaylistSongListProps) {
	if (songs.length === 0) {
		return <Text c="dimmed">No songs in this playlist</Text>;
	}

	return (
		<DragDropContext onDragEnd={onDragEnd}>
			<Droppable droppableId="playlist-songs">
				{(provided) => (
					<Stack ref={provided.innerRef} {...provided.droppableProps}>
						{songs.map((song, index) => (
							<PlaylistSongRow
								key={song.id}
								song={song}
								index={index}
								editing={editing}
								isOwner={isOwner}
								isRemoving={isRemoving}
								navigationUrl={createNavigationUrl(`/song/${song.id}`, location)}
								onRemove={onRemoveSong}
							/>
						))}
						{provided.placeholder}
					</Stack>
				)}
			</Droppable>
		</DragDropContext>
	);
}
