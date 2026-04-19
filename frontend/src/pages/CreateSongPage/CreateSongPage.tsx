import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Group, Stack, TagsInput, Text, Textarea } from '@mantine/core';
import { fillMissingChords } from '../../features/song/helpers/songParser';
import { parseChordPro } from '../../features/song/helpers/chordPro';
import { useCreateSong } from '../../features/song/hooks/song';
import { SongMetaFields } from '../../features/song/components/SongMetaFields';
import { NoWrapTextarea, BackButton } from '../../components';

/**
 * Create song page. Reuses SongMetaFields with Create-local state plus a
 * ChordPro file import path that pre-populates the fields. No transpose
 * toolbar here — new songs start empty, there's nothing to transpose yet.
 */
export const CreateSongPage = () => {
	const navigate = useNavigate();

	const [name, setName] = useState('');
	const [artist, setArtist] = useState('');
	const [content, setContent] = useState('');
	const [rootNote, setRootNote] = useState<string | null>(null);
	const [notes, setNotes] = useState('');
	const [tags, setTags] = useState<string[]>([]);

	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const onPickFile = () => fileInputRef.current?.click();
	const onImportFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
		const f = e.target.files?.[0];
		if (!f) return;
		const text = await f.text();
		const parsed = parseChordPro(text, f.name);
		if (parsed.name) setName(parsed.name);
		if (parsed.artist) setArtist(parsed.artist);
		if (parsed.rootNote !== undefined) setRootNote(parsed.rootNote);
		setContent(parsed.content);
		e.target.value = '';
	};

	const { createSong, isCreating } = useCreateSong({ onSuccess: (id) => navigate(`/song/${id}`) });

	const onSave = async () => {
		if (!name.trim()) return;
		await createSong({
			name,
			artist: artist.trim() ? artist : null,
			content,
			rootNote: rootNote || null,
			description: notes.trim() ? notes.trim() : null,
			tags,
		});
	};

	const onCancel = () => navigate('/my-songs');

	return (
		<Stack gap="md">
			<Group justify="space-between" align="center" wrap="wrap">
				<Group gap="xs">
					<BackButton />
					<Text fw={700} size="xl">
						Create song
					</Text>
				</Group>
				<Group gap="xs">
					<Button variant="outline" onClick={() => setContent((c) => fillMissingChords(c))}>
						Fill chords
					</Button>
					<Button variant="light" onClick={onPickFile}>
						Import ChordPro
					</Button>
				</Group>
				<input
					ref={fileInputRef}
					type="file"
					accept=".pro,.cho,.chordpro,.crd,.chopro,.txt"
					style={{ display: 'none' }}
					onChange={onImportFile}
				/>
			</Group>

			<Card withBorder shadow="sm">
				<Stack gap="md">
					<SongMetaFields
						name={name}
						artist={artist}
						rootNote={rootNote}
						onNameChange={setName}
						onArtistChange={setArtist}
						onRootNoteChange={setRootNote}
					/>
					<TagsInput
						label="Tags"
						description="Press Enter to add a tag. Used for filtering your songs."
						placeholder={tags.length === 0 ? 'e.g. worship, slow, easy' : ''}
						value={tags}
						onChange={setTags}
						clearable
					/>
					<NoWrapTextarea
						label="Content"
						value={content}
						onChange={(e) => setContent(e.currentTarget.value)}
						autosize
						minRows={16}
						spellCheck={false}
					/>
					<Textarea
						label="Notes"
						description="Private notes about this song — arrangement hints, capo tips, vocal reminders."
						placeholder="Optional"
						value={notes}
						onChange={(e) => setNotes(e.currentTarget.value)}
						autosize
						minRows={3}
					/>
					<Group justify="flex-end">
						<Button variant="light" color="gray" onClick={onCancel}>
							Cancel
						</Button>
						<Button onClick={onSave} loading={isCreating} disabled={!name.trim()}>
							Save
						</Button>
					</Group>
				</Stack>
			</Card>
		</Stack>
	);
};
