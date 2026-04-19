import { Badge, Tooltip } from '@mantine/core';
import { computeCapoHint } from '../helpers/capoHint';

interface CapoHintBadgeProps {
	songKey: string;
}

/**
 * Tiny inline badge showing a helpful capo position for the current key.
 * Hides itself when the song is already in an easy guitar key or when
 * there's no reasonable capo position below fret 7.
 *
 * Uses the default easy-key list (G, C, D, E, A) for now. A future
 * settings screen can let the user override which easy keys they prefer.
 */
export function CapoHintBadge({ songKey }: CapoHintBadgeProps) {
	const hint = computeCapoHint(songKey);
	if (!hint) return null;

	return (
		<Tooltip
			label={`Put a capo on fret ${hint.capoFret} and play ${hint.playAsKey} shapes instead of ${songKey}`}
			withArrow
			multiline
			w={240}
		>
			<Badge
				color="accent"
				variant="light"
				size="sm"
				radius="sm"
				style={{ cursor: 'help', textTransform: 'none' }}
			>
				Capo {hint.capoFret} → {hint.playAsKey}
			</Badge>
		</Tooltip>
	);
}
