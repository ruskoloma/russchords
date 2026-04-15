import { ActionIcon, Button, Group, Select, Tooltip } from '@mantine/core';
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import { ALL_KEYS, fillMissingChords } from '../helpers/songParser';

interface SongEditorToolbarProps {
	workKey: string;
	onTransposeUp: () => void;
	onTransposeDown: () => void;
	onSelectKey: (value: string | null) => void;
	onContentChange: (updater: (prev: string) => string) => void;
}

/**
 * Toolbar shown above the song content editor. Contains transpose up/down,
 * a key selector, and the "fill chords" button that propagates first-verse
 * chords into empty later sections.
 *
 * The caller passes `onContentChange` as a functional setter so the fill-
 * chords mutation can be expressed as `(c) => fillMissingChords(c)` without
 * the toolbar ever needing to know the current content.
 */
export function SongEditorToolbar({
	workKey,
	onTransposeUp,
	onTransposeDown,
	onSelectKey,
	onContentChange,
}: SongEditorToolbarProps) {
	const handleFillChords = () => {
		onContentChange((c) => fillMissingChords(c));
		showNotification({
			title: 'Chords filled',
			message: 'Chords successfully propagated',
			color: 'green',
		});
	};

	return (
		<Group gap="0.5em" align="center">
			<ActionIcon onClick={onTransposeDown} aria-label="Key down">
				<IconArrowDown />
			</ActionIcon>
			<Select
				aria-label="Editing key"
				placeholder="Select key"
				data={ALL_KEYS}
				value={workKey}
				onChange={onSelectKey}
				w="7em"
				searchable
			/>
			<ActionIcon onClick={onTransposeUp} aria-label="Key up">
				<IconArrowUp />
			</ActionIcon>
			<Tooltip label="Propagates chords from the first verse/chorus to other sections" multiline w={220} withArrow>
				<Button variant="outline" onClick={handleFillChords}>
					Fill chords
				</Button>
			</Tooltip>
		</Group>
	);
}
