import { useLoaderData } from 'react-router-dom';
import type { CachedSongDto } from '../../types';
import { Viewer } from '../../components/Viewer/Viewer';
import { Box, Divider, Menu, Text } from '@mantine/core';
import { CardHC } from '../../components/CardHC/CardHC';
import { useForkSong } from '../../hooks/song';

export function CachedSongPage() {
	const songDto = useLoaderData() as CachedSongDto;
	const { forkSong, isForking } = useForkSong({ navigateOnSuccess: true });

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
					<Menu.Item key="fork" disabled={isForking} onClick={() => forkSong(songDto.id)}>
						Fork
					</Menu.Item>,
				]}
			/>
			<Divider />
			<CardHC url={songDto.original_url} name={songDto.name} artist={songDto.artist} />
		</>
	);
}
