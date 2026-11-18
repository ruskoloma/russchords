import { ActionIcon, Button, Tooltip } from '@mantine/core';
import { IconStar, IconStarFilled } from '@tabler/icons-react';
import { useIsStarred, useToggleStar } from '../../../api/starred';
import type { SongDto } from '../../../types';

export function StarButton({ song, withLabel = false }: { song: SongDto; withLabel?: boolean }) {
	const starred = useIsStarred(song.id);
	const toggle = useToggleStar();
	const label = starred ? 'Remove from starred' : 'Add to starred';
	const onClick = () => toggle.mutate({ song, starred: !starred });
	const icon = starred ? <IconStarFilled size={18} /> : <IconStar size={18} />;

	if (withLabel) {
		return (
			<Button
				variant={starred ? 'light' : 'default'}
				color={starred ? 'yellow' : undefined}
				leftSection={icon}
				onClick={onClick}
				aria-pressed={starred}
			>
				{starred ? 'Starred' : 'Star'}
			</Button>
		);
	}

	return (
		<Tooltip label={label}>
			<ActionIcon
				size="lg"
				variant="default"
				color={starred ? 'yellow' : undefined}
				onClick={onClick}
				aria-label={label}
				aria-pressed={starred}
				style={starred ? { color: 'var(--mantine-color-yellow-6)' } : undefined}
			>
				{icon}
			</ActionIcon>
		</Tooltip>
	);
}
