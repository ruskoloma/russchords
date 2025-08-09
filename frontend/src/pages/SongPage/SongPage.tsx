import { useLoaderData } from 'react-router-dom';
import type { SongDto } from '../../types';
import { Viewer } from '../../components/Viewer/Viewer';
import { ActionIcon, Box, Divider, Group, Menu, Text } from '@mantine/core';
import { CardHC } from '../../components/CardHC/CardHC';
import { useCloneSong, useDeleteSongs } from '../../hooks/song';
import { useStarredState } from '../../hooks/starred';
import { IconStar } from '@tabler/icons-react';

export function SongPage() {
	const songDto = useLoaderData() as SongDto;

	const { isStarred, isLoading, unstarSong, starSong } = useStarredState(songDto.id);

	const { cloneSong, isCloning } = useCloneSong({ navigateOnSuccess: true });
	const { deleteSongs, isDeleting } = useDeleteSongs();

	const handleDeleteSong = () => deleteSongs([songDto.id]);

	return (
		<>
			<Group justify="space-between">
				<Box>
					<Text size="xl" fw={700}>
						{songDto.name}
					</Text>
					<Text size="md">{songDto.artist}</Text>
				</Box>
				<Box>
					<ActionIcon
						variant={isStarred ? 'filled' : 'outline'}
						color="yellow"
						onClick={isStarred ? unstarSong : starSong}
						disabled={isLoading}
						aria-label={isStarred ? 'Unstar' : 'Star'}
						w={36}
						h={36}
					>
						<IconStar size={20} />
					</ActionIcon>
				</Box>
			</Group>

			<Divider my="sm" />

			<Viewer
				musicText={songDto.content}
				menuItems={[
					<Menu.Item key="clone" disabled={isCloning} onClick={() => cloneSong(songDto.id)}>
						Clone
					</Menu.Item>,
					<Menu.Item key="delete" color="red" disabled={isDeleting} onClick={handleDeleteSong}>
						Delete
					</Menu.Item>,
				]}
			/>

			<Divider />

			<CardHC url={songDto.sourceUrl ?? ''} name={songDto.name} artist={songDto.artist} />
		</>
	);
}
