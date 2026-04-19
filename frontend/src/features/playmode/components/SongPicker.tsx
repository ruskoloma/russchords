import { Box, Button, Menu, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import type { SongDto } from '../../../types';

interface SongPickerProps {
	songs: SongDto[];
	currentIndex: number;
	onPick: (index: number) => void;
}

/**
 * The song dropdown in the play-mode top bar. Shows `{index + 1}. {name}`
 * for each song, with a checkmark + highlight on the current one so the
 * performer can tell at a glance which song is active.
 */
export function SongPicker({ songs, currentIndex, onPick }: SongPickerProps) {
	const current = songs[currentIndex];

	return (
		<Menu shadow="md" width={320} position="bottom">
			<Menu.Target>
				<Button
					variant="subtle"
					color="gray"
					fw={700}
					size="md"
					style={{ flex: 1, textAlign: 'center', height: 'auto', minWidth: 0 }}
				>
					<Text truncate>{current ? `${currentIndex + 1}. ${current.name}` : 'No song'}</Text>
				</Button>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Label>Select song</Menu.Label>
				<Box mah={320} style={{ overflowY: 'auto' }}>
					{songs.map((s, i) => {
						const isActive = i === currentIndex;
						return (
							<Menu.Item
								key={s.id}
								leftSection={isActive ? <IconCheck size={14} /> : <span style={{ width: 14 }} />}
								onClick={() => onPick(i)}
								style={
									isActive
										? { backgroundColor: 'var(--mantine-color-brand-light)', fontWeight: 600 }
										: undefined
								}
							>
								{i + 1}. {s.name}
							</Menu.Item>
						);
					})}
				</Box>
			</Menu.Dropdown>
		</Menu>
	);
}
