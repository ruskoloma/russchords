import { Select, Stack, TextInput } from '@mantine/core';
import { KEYS } from '../helpers/songParser';

interface SongMetaFieldsProps {
	name: string;
	artist: string;
	rootNote: string | null;
	onNameChange: (next: string) => void;
	onArtistChange: (next: string) => void;
	onRootNoteChange: (next: string | null) => void;
}

const KEY_OPTIONS = KEYS.map((k) => ({ value: k.name, label: k.name }));

/**
 * Shared form fieldset used by both Create and Edit song pages. Owns no
 * state — everything is controlled through the props so the parent hooks
 * can keep track of form state, validation, and transposition side
 * effects.
 */
export function SongMetaFields({
	name,
	artist,
	rootNote,
	onNameChange,
	onArtistChange,
	onRootNoteChange,
}: SongMetaFieldsProps) {
	return (
		<Stack gap="md">
			<TextInput label="Name" value={name} onChange={(e) => onNameChange(e.currentTarget.value)} required />
			<TextInput label="Artist" value={artist} onChange={(e) => onArtistChange(e.currentTarget.value)} />
			<Select
				label="Root note"
				placeholder="Not set"
				data={KEY_OPTIONS}
				value={rootNote}
				onChange={onRootNoteChange}
				searchable
				clearable
				nothingFoundMessage="No keys"
				checkIconPosition="right"
			/>
		</Stack>
	);
}
