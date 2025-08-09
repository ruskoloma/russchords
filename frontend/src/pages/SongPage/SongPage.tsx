import { useLoaderData } from 'react-router-dom';
import type { SongDto } from '../../types';
import { Viewer } from '../../components/Viewer/Viewer';
import { Box, Divider, Menu, Text } from '@mantine/core';
import { CardHC } from '../../components/CardHC/CardHC';
import { useCloneSong, useDeleteSongs } from '../../hooks/song';

export function SongPage() {
	const songDto = useLoaderData() as SongDto;

	const { cloneSong, isCloning } = useCloneSong({ navigateOnSuccess: true });
	const { deleteSongs, isDeleting } = useDeleteSongs({ navigateOnSuccess: true });
	// const { addToPlaylist, isAdding } = useAddSongsToPlaylist();

	const handelDeleteSong = () => {
		return deleteSongs([songDto.id]);
	};

	return (
		<>
			<Box>
				<Text size={'xl'} fw={700}>
					{songDto.name}
				</Text>
				<Text size={'md'} fw={400}>
					{songDto.artist}
				</Text>
			</Box>
			<Divider my={'sm'} />
			<Viewer
				musicText={songDto.content}
				menuItems={[
					<Menu.Item key="clone" disabled={isCloning} onClick={() => cloneSong(songDto.id)}>
						Clone
					</Menu.Item>,
					<Menu.Item key="delete" color="red" disabled={isDeleting} onClick={handelDeleteSong}>
						Delete
					</Menu.Item>,
				]}
			/>
			<Divider />
			<CardHC url={songDto.sourceUrl ?? ''} name={songDto.name} artist={songDto.artist} />
		</>
	);
}
