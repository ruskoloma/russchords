import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Group, Select, Stack, Text, TextInput } from '@mantine/core';
import { KEYS, fillMissingChords } from '../../helpers/songParser';
import { parseChordPro } from '../../helpers/chordPro';
import { useCreateSong } from '../../hooks/song';
import { NoWrapTextarea } from '../../components';

export const CreateSongPage = () => {
	const navigate = useNavigate();

	const [name, setName] = useState('');
	const [artist, setArtist] = useState('');
	const [content, setContent] = useState('');
	const [rootNote, setRootNote] = useState<string | null>(null);

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

	const keyOptions = KEYS.map((k) => ({ value: k.name, label: k.name }));

	const onSave = async () => {
		if (!name.trim()) return;
		await createSong({
			name,
			artist: artist.trim() ? artist : null,
			content,
			rootNote: rootNote || null,
		});
	};

	const onCancel = () => {
		navigate('/my-songs');
	};

	return (
		<Stack gap="md">
			<Group justify="space-between" align="center">
				<Text fw={700} size="xl">
					Create song
				</Text>
				<Group>
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
					<TextInput label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} required />
					<TextInput label="Artist" value={artist} onChange={(e) => setArtist(e.currentTarget.value)} />
					<Select
						label="Root note"
						placeholder="Not set"
						data={keyOptions}
						value={rootNote}
						onChange={setRootNote}
						searchable
						clearable
						nothingFoundMessage="No keys"
						checkIconPosition="right"
					/>
					<NoWrapTextarea
						label="Content"
						value={content}
						onChange={(e) => setContent(e.currentTarget.value)}
						autosize
						minRows={16}
						spellCheck={false}
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
