import { Card, Group, Stack, Text } from '@mantine/core';
import { IconPlayerTrackNext } from '@tabler/icons-react';
import type { SongDto } from '../../../types';

interface UpNextCardProps {
	nextSong: SongDto | null;
	onAdvance: () => void;
}

/**
 * Bottom-of-song "Up next" hint card. Displays the name of the next song
 * in the playlist and advances on tap. Rendered only when there IS a
 * next song; returns null at the end of a playlist so the card doesn't
 * show an empty "nothing next" state.
 *
 * Sized to be unobtrusive mid-song but big enough to tap reliably on a
 * phone / tablet during live performance.
 */
export function UpNextCard({ nextSong, onAdvance }: UpNextCardProps) {
	if (!nextSong) return null;

	return (
		<Card
			withBorder
			shadow="sm"
			my="xl"
			p="md"
			style={{
				cursor: 'pointer',
				borderColor: 'var(--mantine-color-brand-filled)',
			}}
			onClick={onAdvance}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onAdvance();
				}
			}}
			aria-label={`Advance to next song: ${nextSong.name}`}
		>
			<Group justify="space-between" wrap="nowrap">
				<Stack gap={2} style={{ minWidth: 0 }}>
					<Text size="xs" c="dimmed" fw={600} tt="uppercase">
						Up next
					</Text>
					<Text fw={600} truncate>
						{nextSong.name}
					</Text>
					{nextSong.artist && (
						<Text size="sm" c="dimmed" truncate>
							{nextSong.artist}
						</Text>
					)}
				</Stack>
				<IconPlayerTrackNext size={24} color="var(--mantine-color-brand-filled)" />
			</Group>
		</Card>
	);
}
