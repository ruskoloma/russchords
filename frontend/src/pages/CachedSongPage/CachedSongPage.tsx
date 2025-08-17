import { useLoaderData, Link } from 'react-router-dom';
import type { CachedSongDto } from '../../types';
import { Viewer } from '../../components/Viewer/Viewer';
import { Box, Divider, Menu, Text, Card, Group, Badge, Stack, Title } from '@mantine/core';
import { CardHC } from '../../components/CardHC/CardHC';
import { useForkSong, useMyForksByOriginalId } from '../../hooks/song';
import { useAuth } from 'react-oidc-context';

export function CachedSongPage() {
	const songDto = useLoaderData() as CachedSongDto;
	const { isAuthenticated } = useAuth();
	const { forkSong, isForking } = useForkSong({ navigateOnSuccess: true });

	const originalId = Number(songDto.id);
	const { forks, isLoading: isForksLoading } = useMyForksByOriginalId(originalId, isAuthenticated);

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
					isAuthenticated && (
						<Menu.Item key="fork" disabled={isForking} onClick={() => forkSong(songDto.id)}>
							Fork
						</Menu.Item>
					),
				].filter(Boolean)}
			/>
			{isAuthenticated && (
				<>
					<Divider />
					<Stack gap="sm" py="sm">
						<Title order={4}>Your forks</Title>
						{isForksLoading && (
							<Text size="sm" c="dimmed">
								Loading your forks...
							</Text>
						)}
						{!isForksLoading && forks.length === 0 && (
							<Text size="sm" c="dimmed">
								You have no forks of this song yet.
							</Text>
						)}
						{forks.map((s) => (
							<Card key={s.id} withBorder component={Link} to={`/song/${s.id}`}>
								<Group justify="space-between">
									<Box>
										<Text fw={600}>{s.name}</Text>
										{s.artist && (
											<Text size="sm" c="dimmed">
												{s.artist}
											</Text>
										)}
									</Box>
									{s.rootNote && <Badge variant="light">{s.rootNote}</Badge>}
								</Group>
							</Card>
						))}
					</Stack>
				</>
			)}
			<Divider />
			<CardHC url={songDto.originalUrl} name={songDto.name} artist={songDto.artist} />
		</>
	);
}
